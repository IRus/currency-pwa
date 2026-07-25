import {describe, expect, it} from "vitest";
import {convert, sanitizeRows} from "./convert";

const fixer = {EUR: 1, USD: 1.1, BYN: 3.5};

describe("convert", () => {
  it("converts through the base rate", () => {
    expect(convert("100", "EUR", "BYN", fixer)).toBe("350.00");
  });

  it("treats an empty amount as zero", () => {
    expect(convert("", "EUR", "BYN", fixer)).toBe("0.00");
  });

  it("returns nothing when the source currency has no rate", () => {
    expect(convert("100", "XXX", "BYN", fixer)).toBe("");
  });

  it("returns nothing when the target currency has no rate", () => {
    expect(convert("100", "EUR", "XXX", fixer)).toBe("");
  });

  it("returns nothing for a half-typed amount", () => {
    expect(convert(".", "EUR", "BYN", fixer)).toBe("");
  });

  it("never yields NaN while 0.5 is typed character by character", () => {
    for (const partial of ["0", "0.", "0.5"]) {
      expect(convert(partial, "EUR", "BYN", fixer)).not.toContain("NaN");
    }
  });

  it("sanitizes a previously persisted NaN", () => {
    expect(convert("NaN", "EUR", "BYN", fixer)).toBe("0.00");
  });
});

describe("sanitizeRows", () => {
  it("drops currencies that today's rates no longer price", () => {
    const rows = sanitizeRows([{currency: "XXX", value: "100"}, {currency: "EUR", value: "1"}], fixer);
    expect(rows.map(row => row.currency)).toEqual(["EUR"]);
  });

  it("clears persisted NaN values", () => {
    expect(sanitizeRows([{currency: "EUR", value: "NaN"}], fixer)[0].value).toBe("");
  });

  it("returns nothing for input that is not an array", () => {
    expect(sanitizeRows(null, fixer)).toEqual([]);
    expect(sanitizeRows({currency: "EUR"}, fixer)).toEqual([]);
  });
});
