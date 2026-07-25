import {Fixer} from "./Fixer";
import {normalize} from "./Normalize";

export type Row = {
  currency: string;
  value: string;
  selected?: boolean;
};

/**
 * Converts an amount from one currency to another.
 *
 * Returns "" instead of a number when the result cannot be trusted: either rate
 * may be missing, and a half-typed amount like "." parses to NaN. Both used to
 * reach the DOM and localStorage as the literal string "NaN", which then
 * survived every reload because normalize("NaN") is "" rather than "0".
 */
export function convert(value: string, from: string, to: string, fixer: Fixer): string {
  const fromRate = fixer[from];
  const toRate = fixer[to];

  if (!isUsableRate(fromRate) || !isUsableRate(toRate)) return "";

  const amount = Number(normalize(value));
  if (!Number.isFinite(amount)) return "";

  return (amount / (fromRate / toRate)).toFixed(2);
}

/**
 * Drops rows that today's rates can no longer price. Rates are regenerated
 * daily and fixer.io adds and removes codes, so a currency saved months ago may
 * simply not exist any more.
 */
export function sanitizeRows(stored: unknown, fixer: Fixer): Array<Row> {
  if (!Array.isArray(stored)) return [];

  return stored
    .filter(row => row != null && isUsableRate(fixer[row.currency]))
    .map(row => ({
      currency: row.currency as string,
      value: typeof row.value === "string" && row.value !== "NaN" ? row.value : "",
      selected: row.selected === true
    }));
}

function isUsableRate(rate: unknown): rate is number {
  return typeof rate === "number" && Number.isFinite(rate) && rate > 0;
}
