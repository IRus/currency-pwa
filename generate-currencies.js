const fs = require("fs");

const OUTPUT_PATH = "./src/data.json";
const TIMEOUT_MS = 20000;

/**
 * Every source is a name, a URL and a parser that turns whatever that endpoint
 * answers with into one shape: "units of X per 1 unit of the source's base".
 * Only ratios ever leave this file, so which base a source picked stops
 * mattering the moment its table is built.
 *
 * Adding a source means adding an entry here. Nothing downstream — neither the
 * writer below nor the app — knows how many there are.
 */
const SOURCES = [
  {
    id: "fixer",
    name: "Fixer.io",
    url: "https://fixer.io/",
    // The app is unusable without the one table that prices everything, so a
    // fixer.io failure still fails the build. The other two are extras: losing
    // one for a day costs a menu entry, not the converter.
    required: true,
    // fixer.io normally returns ~170 currencies. A response far below that is a
    // truncated or malformed payload, not a real rate table.
    minCurrencies: 50,
    // The currencies the app ships as its default rows.
    mustHave: ["USD", "EUR", "BYN"],
    request: () => {
      if (!process.env.FIXER_IO_TOKEN) throw new Error("FIXER_IO_TOKEN is not set");
      return `https://data.fixer.io/api/latest?access_key=${process.env.FIXER_IO_TOKEN}`;
    },
    parse: parseFixer
  },
  {
    id: "nbrb",
    name: "NBRB",
    url: "https://www.nbrb.by/statistics/rates/ratesdaily",
    required: false,
    // The National Bank publishes a fixed list of about 30 currencies.
    minCurrencies: 20,
    mustHave: ["USD", "EUR", "BYN"],
    request: () => "https://api.nbrb.by/exrates/rates?periodicity=0",
    parse: parseNbrb
  },
  {
    id: "bundesbank",
    name: "Bundesbank",
    url: "https://www.bundesbank.de/en/statistics/money-and-capital-markets/exchange-rates",
    required: false,
    // BBEX3 carries about 30 live currencies plus a tail of retired ones that
    // parseBundesbank drops.
    minCurrencies: 20,
    // No BYN here: the Bundesbank does not quote the Belarusian ruble.
    mustHave: ["USD", "EUR"],
    request: () =>
      "https://api.statistiken.bundesbank.de/rest/data/BBEX3/D..EUR.BB.AC.000?lastNObservations=1&format=json",
    parse: parseBundesbank
  }
];

/**
 * fixer.io reports quota exhaustion and auth failures with HTTP 200 and a
 * {"success": false} body, so the status code alone proves nothing. Without
 * this check `{...undefined}` and `[undefined]: 1` silently produced a rate
 * table consisting of the single currency "undefined".
 */
function parseFixer(payload) {
  if (payload === null || typeof payload !== "object") {
    throw new Error("payload is not an object");
  }

  if (payload.success !== true) {
    throw new Error(`reported a failure: ${JSON.stringify(payload.error ?? payload)}`);
  }

  if (typeof payload.base !== "string" || payload.base.length === 0) {
    throw new Error("response carries no base currency");
  }

  if (payload.rates === null || typeof payload.rates !== "object") {
    throw new Error("response carries no rates");
  }

  return {
    rates: {...payload.rates, [payload.base]: 1},
    date: typeof payload.date === "string" ? payload.date : null
  };
}

/**
 * The National Bank quotes the other way round and in blocks: Cur_OfficialRate
 * is how many rubles you pay for Cur_Scale units, so 1000 Armenian drams cost
 * 8.53 BYN. Inverting through the scale puts it on the same footing as the
 * other sources.
 */
function parseNbrb(payload) {
  if (!Array.isArray(payload)) {
    throw new Error("payload is not an array");
  }

  const rates = {BYN: 1};
  let date = null;

  for (const entry of payload) {
    if (entry === null || typeof entry !== "object") continue;

    const code = entry.Cur_Abbreviation;
    const scale = entry.Cur_Scale;
    const rate = entry.Cur_OfficialRate;

    if (typeof code !== "string" || code.length === 0) continue;
    if (!isPositiveNumber(scale) || !isPositiveNumber(rate)) continue;

    rates[code] = scale / rate;

    if (typeof entry.Date === "string") {
      const day = entry.Date.slice(0, 10);
      if (date === null || day > date) date = day;
    }
  }

  return {rates, date};
}

/**
 * SDMX-JSON keeps the data and the labels apart: a series is addressed by a
 * colon-joined list of positions into structure.dimensions.series, and an
 * observation by a position into the shared list of time periods.
 *
 * lastNObservations=1 is per series, and BBEX3 still carries currencies that
 * died with the euro changeover — the last drachma quote is from 2007. Keeping
 * only the newest date drops them without a hardcoded list of the dead.
 */
function parseBundesbank(payload) {
  const structure = payload?.data?.structure;
  const dataSet = payload?.data?.dataSets?.[0];

  if (structure === undefined || dataSet === undefined) {
    throw new Error("response carries no data set");
  }

  const dimensions = structure.dimensions?.series;
  if (!Array.isArray(dimensions)) {
    throw new Error("response carries no series dimensions");
  }

  const currencyPosition = dimensions.findIndex(dimension => dimension.id === "BBK_STD_CURRENCY");
  if (currencyPosition === -1) {
    throw new Error("response carries no currency dimension");
  }

  const currencies = dimensions[currencyPosition].values ?? [];
  const periods = structure.dimensions?.observation?.[0]?.values ?? [];

  const byDate = new Map();

  for (const [key, series] of Object.entries(dataSet.series ?? {})) {
    const code = currencies[Number(key.split(":")[currencyPosition])]?.id;
    if (typeof code !== "string" || code.length === 0) continue;

    for (const [position, observation] of Object.entries(series.observations ?? {})) {
      const day = periods[Number(position)]?.id;
      const rate = Number(observation?.[0]);

      if (typeof day !== "string" || !isPositiveNumber(rate)) continue;

      if (!byDate.has(day)) byDate.set(day, {});
      byDate.get(day)[code] = rate;
    }
  }

  const date = [...byDate.keys()].sort().pop();
  if (date === undefined) {
    throw new Error("response carries no observations");
  }

  return {
    rates: {...byDate.get(date), EUR: 1},
    date: date
  };
}

/**
 * Turns one source's response into the record the app is compiled against, or
 * throws with a reason. Bailing out here leaves the previous rates in place
 * rather than publishing a broken converter.
 */
function buildSource(source, statusCode, body, buildDate) {
  if (statusCode !== 200) {
    throw new Error(`${source.name} answered with HTTP ${statusCode}`);
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch (e) {
    throw new Error(`${source.name} answered with something that is not JSON: ${e.message}`);
  }

  let parsed;
  try {
    parsed = source.parse(payload);
  } catch (e) {
    throw new Error(`${source.name} ${e.message}`);
  }

  const rates = {};
  for (const [code, rate] of Object.entries(parsed.rates)) {
    if (isPositiveNumber(rate)) rates[code] = rate;
  }

  const count = Object.keys(rates).length;
  if (count < source.minCurrencies) {
    throw new Error(`${source.name} returned ${count} currencies, expected at least ${source.minCurrencies}`);
  }

  const missing = source.mustHave.filter(currency => rates[currency] === undefined);
  if (missing.length !== 0) {
    throw new Error(`${source.name} response is missing ${missing.join(", ")}`);
  }

  return {
    id: source.id,
    name: source.name,
    url: source.url,
    // The day the rates are for, when the source says so. The build date is
    // only a fallback: it is the wrong answer over a weekend, when the build
    // runs and the central banks do not.
    updated: formatDate(parsed.date) ?? buildDate,
    rates: rates
  };
}

function isPositiveNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function formatDate(isoDate) {
  if (typeof isoDate !== "string") return null;

  const parsed = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  });
}

function getBuildDate(today) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric"
  };
  return today.toLocaleDateString("en-US", options);
}

async function load(source, buildDate) {
  const response = await fetch(source.request(), {
    headers: {accept: "application/json"},
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });

  return buildSource(source, response.status, await response.text(), buildDate);
}

/**
 * Decides what a round of fetches amounts to. A source nobody can do without
 * takes the build down with it; the rest are allowed to be missing, because an
 * endpoint that is down for an afternoon should cost the menu one entry rather
 * than leave yesterday's rates deployed.
 */
function collect(sources, results) {
  const built = [];

  results.forEach((result, index) => {
    const source = sources[index];

    if (result.status === "fulfilled") {
      built.push(result.value);
      console.log(`${source.name}: ${Object.keys(result.value.rates).length} currencies, ${result.value.updated}`);
      return;
    }

    const reason = result.reason?.message ?? result.reason;

    if (source.required) throw new Error(String(reason));

    console.warn(`Warning: skipping ${source.name} (${reason})`);
  });

  return built;
}

async function main() {
  const buildDate = getBuildDate(new Date());
  const results = await Promise.allSettled(SOURCES.map(source => load(source, buildDate)));

  let built;
  try {
    built = collect(SOURCES, results);
  } catch (e) {
    // Bailing out before the write leaves the previous rates in place rather
    // than publishing a broken converter.
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({sources: built}));
  console.log(`Wrote ${built.length} sources to ${OUTPUT_PATH}`);
}

module.exports = {SOURCES, buildSource, collect, getBuildDate, parseFixer, parseNbrb, parseBundesbank};

if (require.main === module) {
  main();
}
