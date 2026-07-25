const https = require("https");
const fs = require("fs");

const OUTPUT_PATH = "./src/data.json";

// fixer.io normally returns ~170 currencies. A response far below that is a
// truncated or malformed payload, not a real rate table.
const MIN_EXPECTED_CURRENCIES = 50;

// The currencies the app ships as its default rows.
const REQUIRED_CURRENCIES = ["USD", "EUR", "BYN"];

/**
 * Turns a fixer.io response into the file the app is compiled against, or
 * throws with a reason.
 *
 * fixer.io reports quota exhaustion and auth failures with HTTP 200 and a
 * {"success": false} body, so the status code alone proves nothing. Without
 * this check `{...undefined}` and `[undefined]: 1` silently produced a rate
 * table consisting of the single currency "undefined".
 */
function buildCurrencyData(statusCode, body, buildDate) {
  if (statusCode !== 200) {
    throw new Error(`fixer.io answered with HTTP ${statusCode}`);
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch (e) {
    throw new Error(`fixer.io answered with something that is not JSON: ${e.message}`);
  }

  if (payload === null || typeof payload !== "object") {
    throw new Error("fixer.io answered with a non-object payload");
  }

  if (payload.success !== true) {
    throw new Error(`fixer.io reported a failure: ${JSON.stringify(payload.error ?? payload)}`);
  }

  if (typeof payload.base !== "string" || payload.base.length === 0) {
    throw new Error("fixer.io response carries no base currency");
  }

  if (payload.rates === null || typeof payload.rates !== "object") {
    throw new Error("fixer.io response carries no rates");
  }

  const fixer = {...payload.rates, [payload.base]: 1};

  const count = Object.keys(fixer).length;
  if (count < MIN_EXPECTED_CURRENCIES) {
    throw new Error(`fixer.io returned ${count} currencies, expected at least ${MIN_EXPECTED_CURRENCIES}`);
  }

  const missing = REQUIRED_CURRENCIES.filter(currency => typeof fixer[currency] !== "number");
  if (missing.length !== 0) {
    throw new Error(`fixer.io response is missing ${missing.join(", ")}`);
  }

  return {
    fixer: fixer,
    updated: buildDate
  };
}

function getBuildDate(today) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric"
  };
  return today.toLocaleDateString("en-US", options);
}

function main() {
  if (!process.env.FIXER_IO_TOKEN) {
    console.error("Error: FIXER_IO_TOKEN is not set");
    process.exit(1);
  }

  https.get(`https://data.fixer.io/api/latest?access_key=${process.env.FIXER_IO_TOKEN}`, (response) => {
    const chunks = [];

    response.on("data", (chunk) => {
      chunks.push(chunk);
    });

    response.on("end", () => {
      let data;
      try {
        // Concatenating the buffers before decoding, so a multi-byte character
        // split across two chunks cannot be mangled.
        const body = Buffer.concat(chunks).toString("utf8");
        data = buildCurrencyData(response.statusCode, body, getBuildDate(new Date()));
      } catch (e) {
        // Bailing out before the write leaves the previous rates in place
        // rather than publishing a broken converter.
        console.error(`Error: ${e.message}`);
        process.exit(1);
      }

      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data));
      console.log(`Wrote ${Object.keys(data.fixer).length} currencies to ${OUTPUT_PATH}`);
    });
  }).on("error", (err) => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {buildCurrencyData, getBuildDate};

if (require.main === module) {
  main();
}
