import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {buildSource, collect, parseBundesbank, parseFixer, parseNbrb, SOURCES} from "./generate-currencies.js";

const fixerSource = SOURCES.find(source => source.id === "fixer");
const nbrbSource = SOURCES.find(source => source.id === "nbrb");
const bundesbankSource = SOURCES.find(source => source.id === "bundesbank");

function fixerRates(overrides) {
  const filler = {};
  for (let i = 0; i < 60; i++) {
    filler[`C${i}`] = 1 + i;
  }
  return {USD: 1.1, BYN: 3.5, ...filler, ...overrides};
}

function fixerBody(overrides) {
  return JSON.stringify({success: true, base: "EUR", date: "2026-07-26", rates: fixerRates(), ...overrides});
}

function nbrbBody(entries) {
  const filler = [];
  for (let i = 0; i < 20; i++) {
    filler.push({Cur_Abbreviation: `C${i}`, Cur_Scale: 1, Cur_OfficialRate: 1 + i, Date: "2026-07-26T00:00:00"});
  }
  return JSON.stringify(entries ?? [
    {Cur_Abbreviation: "USD", Cur_Scale: 1, Cur_OfficialRate: 3, Date: "2026-07-26T00:00:00"},
    {Cur_Abbreviation: "EUR", Cur_Scale: 1, Cur_OfficialRate: 3.5, Date: "2026-07-26T00:00:00"},
    {Cur_Abbreviation: "AMD", Cur_Scale: 1000, Cur_OfficialRate: 8, Date: "2026-07-26T00:00:00"},
    ...filler
  ]);
}

/**
 * The shape the Bundesbank answers with: series addressed by position into the
 * dimension list, observations by position into a shared list of dates.
 */
function bundesbankBody(overrides = {}) {
  const codes = ["USD", "GRD", ...Array.from({length: 20}, (_, i) => `C${i}`)];
  const periods = overrides.periods ?? ["2026-07-24", "2007-12-31"];

  const series = {};
  codes.forEach((code, index) => {
    // GRD is the retired drachma: its newest quote sits on the older date.
    const period = code === "GRD" ? 1 : 0;
    series[`0:${index}:0:0:0:0`] = {observations: {[period]: [String(index + 1)]}};
  });

  return JSON.stringify({
    data: {
      structure: {
        dimensions: {
          series: [
            {id: "BBK_STD_FREQ", values: [{id: "D"}]},
            {id: "BBK_STD_CURRENCY", values: codes.map(id => ({id}))},
            {id: "BBK_ERX_PARTNER_CURRENCY", values: [{id: "EUR"}]},
            {id: "BBK_ERX_SERIES_TYPE", values: [{id: "BB"}]},
            {id: "BBK_ERX_RATE_TYPE", values: [{id: "AC"}]},
            {id: "BBK_ERX_SUFFIX", values: [{id: "000"}]}
          ],
          observation: [{id: "TIME_PERIOD", values: periods.map(id => ({id}))}]
        }
      },
      dataSets: [{series: overrides.series ?? series}]
    }
  });
}

describe("buildSource", () => {
  it("dates the table from the source rather than the build", () => {
    const built = buildSource(fixerSource, 200, fixerBody(), "January 1, 1970");

    expect(built.updated).toBe("July 26, 2026");
  });

  it("falls back to the build date when the source does not say", () => {
    const built = buildSource(fixerSource, 200, fixerBody({date: undefined}), "July 26, 2026");

    expect(built.updated).toBe("July 26, 2026");
  });

  it("carries the id, name and url the app renders", () => {
    const built = buildSource(fixerSource, 200, fixerBody(), "d");

    expect(built.id).toBe("fixer");
    expect(built.name).toBe("Fixer.io");
    expect(built.url).toMatch(/^https:/);
  });

  it("rejects a non-200 response", () => {
    expect(() => buildSource(fixerSource, 503, fixerBody(), "d")).toThrow(/HTTP 503/);
  });

  it("rejects a body that is not JSON", () => {
    expect(() => buildSource(fixerSource, 200, "<html>gateway timeout</html>", "d")).toThrow(/not JSON/);
  });

  it("rejects a suspiciously short rate table", () => {
    expect(() => buildSource(fixerSource, 200, fixerBody({rates: {USD: 1.1}}), "d")).toThrow(/expected at least/);
  });

  it("rejects a rate table missing a currency the app defaults to", () => {
    const body = fixerBody({rates: fixerRates({BYN: undefined})});

    expect(() => buildSource(fixerSource, 200, body, "d")).toThrow(/missing BYN/);
  });

  it("drops rates that are not usable numbers", () => {
    const built = buildSource(fixerSource, 200, fixerBody({rates: fixerRates({XXX: 0, YYY: "1.5"})}), "d");

    expect(built.rates.XXX).toBeUndefined();
    expect(built.rates.YYY).toBeUndefined();
  });

  it("does not ask the Bundesbank for the Belarusian ruble", () => {
    const built = buildSource(bundesbankSource, 200, bundesbankBody(), "d");

    expect(built.rates.BYN).toBeUndefined();
    expect(built.rates.USD).toBeDefined();
  });
});

describe("parseFixer", () => {
  it("folds the base currency into the table at 1", () => {
    const {rates} = parseFixer(JSON.parse(fixerBody()));

    expect(rates.EUR).toBe(1);
    expect(rates.USD).toBe(1.1);
  });

  it("rejects a failure reported with HTTP 200", () => {
    const failure = {success: false, error: {code: 104, type: "usage_limit_reached"}};

    expect(() => parseFixer(failure)).toThrow(/usage_limit_reached/);
  });

  it("rejects a response without rates", () => {
    expect(() => parseFixer({success: true, base: "EUR"})).toThrow(/no rates/);
  });

  it("rejects a response without a base currency", () => {
    expect(() => parseFixer({success: true, rates: {}})).toThrow(/no base currency/);
  });
});

describe("parseNbrb", () => {
  it("inverts the quote and divides out the scale", () => {
    const {rates} = parseNbrb(JSON.parse(nbrbBody()));

    expect(rates.BYN).toBe(1);
    // 3 rubles to the dollar means a third of a dollar to the ruble.
    expect(rates.USD).toBeCloseTo(1 / 3, 10);
    // 1000 drams cost 8 rubles.
    expect(rates.AMD).toBeCloseTo(125, 10);
  });

  it("prices a dollar in rubles at the rate it was quoted", () => {
    const {rates} = parseNbrb(JSON.parse(nbrbBody()));

    expect(rates.BYN / rates.USD).toBeCloseTo(3, 10);
  });

  it("takes the date the rates are for", () => {
    const {date} = parseNbrb(JSON.parse(nbrbBody()));

    expect(date).toBe("2026-07-26");
  });

  it("skips entries that carry no usable quote", () => {
    const body = nbrbBody([
      {Cur_Abbreviation: "USD", Cur_Scale: 1, Cur_OfficialRate: 3},
      {Cur_Abbreviation: "XXX", Cur_Scale: 1, Cur_OfficialRate: 0},
      {Cur_Abbreviation: "YYY", Cur_Scale: 0, Cur_OfficialRate: 1},
      {Cur_Scale: 1, Cur_OfficialRate: 1}
    ]);
    const {rates} = parseNbrb(JSON.parse(body));

    expect(Object.keys(rates).sort()).toEqual(["BYN", "USD"]);
  });

  it("rejects a payload that is not a list of quotes", () => {
    expect(() => parseNbrb({rates: []})).toThrow(/not an array/);
  });
});

describe("collect", () => {
  const sources = [{id: "a", name: "A", required: true}, {id: "b", name: "B", required: false}];

  function fulfilled(id) {
    return {status: "fulfilled", value: {id: id, rates: {USD: 1}, updated: "d"}};
  }

  function rejected(message) {
    return {status: "rejected", reason: new Error(message)};
  }

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the sources that answered, in the order they are declared", () => {
    const built = collect(sources, [fulfilled("a"), fulfilled("b")]);

    expect(built.map(source => source.id)).toEqual(["a", "b"]);
  });

  it("goes on without a source that is only nice to have", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const built = collect(sources, [fulfilled("a"), rejected("B is down")]);

    expect(built.map(source => source.id)).toEqual(["a"]);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("B is down"));
  });

  it("takes the build down with a source the app cannot open without", () => {
    expect(() => collect(sources, [rejected("A is down"), fulfilled("b")])).toThrow(/A is down/);
  });
});

describe("parseBundesbank", () => {
  it("reads a rate through the series and time dimensions", () => {
    const {rates, date} = parseBundesbank(JSON.parse(bundesbankBody()));

    expect(rates.EUR).toBe(1);
    expect(rates.USD).toBe(1);
    expect(date).toBe("2026-07-24");
  });

  it("drops currencies whose newest quote predates the rest", () => {
    const {rates} = parseBundesbank(JSON.parse(bundesbankBody()));

    expect(rates.GRD).toBeUndefined();
  });

  it("rejects a response with no observations at all", () => {
    expect(() => parseBundesbank(JSON.parse(bundesbankBody({series: {}})))).toThrow(/no observations/);
  });

  it("rejects a response that is not a data message", () => {
    expect(() => parseBundesbank({status: 406})).toThrow(/no data set/);
  });
});
