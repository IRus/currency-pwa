import {describe, expect, it} from "vitest";
import {buildCurrencyData} from "./generate-currencies.js";

function rates(overrides) {
  const filler = {};
  for (let i = 0; i < 60; i++) {
    filler[`C${i}`] = 1 + i;
  }
  return {USD: 1.1, BYN: 3.5, ...filler, ...overrides};
}

function body(overrides) {
  return JSON.stringify({success: true, base: "EUR", rates: rates(), ...overrides});
}

describe("buildCurrencyData", () => {
  it("builds the rate table and folds the base currency in at 1", () => {
    const data = buildCurrencyData(200, body(), "July 26, 2026");

    expect(data.updated).toBe("July 26, 2026");
    expect(data.fixer.EUR).toBe(1);
    expect(data.fixer.USD).toBe(1.1);
  });

  it("rejects a non-200 response", () => {
    expect(() => buildCurrencyData(503, body(), "d")).toThrow(/HTTP 503/);
  });

  it("rejects a failure reported with HTTP 200", () => {
    const failure = JSON.stringify({success: false, error: {code: 104, type: "usage_limit_reached"}});
    expect(() => buildCurrencyData(200, failure, "d")).toThrow(/usage_limit_reached/);
  });

  it("rejects a body that is not JSON", () => {
    expect(() => buildCurrencyData(200, "<html>gateway timeout</html>", "d")).toThrow(/not JSON/);
  });

  it("rejects a response without rates", () => {
    expect(() => buildCurrencyData(200, body({rates: undefined}), "d")).toThrow(/no rates/);
  });

  it("rejects a response without a base currency", () => {
    expect(() => buildCurrencyData(200, body({base: undefined}), "d")).toThrow(/no base currency/);
  });

  it("rejects a suspiciously short rate table", () => {
    expect(() => buildCurrencyData(200, body({rates: {USD: 1.1}}), "d")).toThrow(/expected at least/);
  });

  it("rejects a rate table missing a currency the app defaults to", () => {
    expect(() => buildCurrencyData(200, body({rates: rates({BYN: undefined})}), "d")).toThrow(/missing BYN/);
  });
});
