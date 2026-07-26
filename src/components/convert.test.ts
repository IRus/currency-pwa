import {describe, expect, it} from "vitest";
import {convert, isPriced, sanitizeRows} from "./convert";

const rates = {EUR: 1, USD: 1.1, BYN: 3.5};

describe("convert", () => {
  it("converts through the base rate", () => {
    expect(convert("100", "EUR", "BYN", rates)).toBe("350.00");
  });

  it("treats an empty amount as zero", () => {
    expect(convert("", "EUR", "BYN", rates)).toBe("0.00");
  });

  it("returns nothing when the source currency has no rate", () => {
    expect(convert("100", "XXX", "BYN", rates)).toBe("");
  });

  it("returns nothing when the target currency has no rate", () => {
    expect(convert("100", "EUR", "XXX", rates)).toBe("");
  });

  it("returns nothing for a half-typed amount", () => {
    expect(convert(".", "EUR", "BYN", rates)).toBe("");
  });

  it("never yields NaN while 0.5 is typed character by character", () => {
    for (const partial of ["0", "0.", "0.5"]) {
      expect(convert(partial, "EUR", "BYN", rates)).not.toContain("NaN");
    }
  });

  it("sanitizes a previously persisted NaN", () => {
    expect(convert("NaN", "EUR", "BYN", rates)).toBe("0.00");
  });
});

describe("sanitizeRows", () => {
  it("keeps currencies the current rates do not price", () => {
    const rows = sanitizeRows([{currency: "XXX", value: "100"}, {currency: "EUR", value: "1"}]);
    expect(rows.map(row => row.currency)).toEqual(["XXX", "EUR"]);
  });

  it("clears persisted NaN values", () => {
    expect(sanitizeRows([{currency: "EUR", value: "NaN"}])[0].value).toBe("");
  });

  it("keeps the first of two rows holding the same currency", () => {
    const rows = sanitizeRows([{currency: "EUR", value: "1"}, {currency: "EUR", value: "2"}]);
    expect(rows).toEqual([{currency: "EUR", value: "1", selected: false}]);
  });

  it("drops rows without a currency", () => {
    expect(sanitizeRows([null, {value: "1"}, {currency: "", value: "1"}])).toEqual([]);
  });

  it("returns nothing for input that is not an array", () => {
    expect(sanitizeRows(null)).toEqual([]);
    expect(sanitizeRows({currency: "EUR"})).toEqual([]);
  });
});

describe("isPriced", () => {
  it("accepts a positive finite rate", () => {
    expect(isPriced(rates, "BYN")).toBe(true);
  });

  it("rejects a currency the table does not list", () => {
    expect(isPriced(rates, "XXX")).toBe(false);
  });

  it("rejects a rate that cannot divide", () => {
    expect(isPriced({ZWL: 0}, "ZWL")).toBe(false);
  });
});
