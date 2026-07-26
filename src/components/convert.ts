import {Rates} from "./Rates";
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
export function convert(value: string, from: string, to: string, rates: Rates): string {
  const fromRate = rates[from];
  const toRate = rates[to];

  if (!isUsableRate(fromRate) || !isUsableRate(toRate)) return "";

  const amount = Number(normalize(value));
  if (!Number.isFinite(amount)) return "";

  return (amount / (fromRate / toRate)).toFixed(2);
}

/**
 * Reads back what was persisted without judging it against any rate table. The
 * rows are the user's selection, not the source's, so a currency the current
 * source cannot price stays in the list — dropping it here is what made it
 * disappear for good on the way from a table of 170 currencies to one of 30 and
 * back again.
 */
export function sanitizeRows(stored: unknown): Array<Row> {
  if (!Array.isArray(stored)) return [];

  const rows: Array<Row> = [];

  for (const row of stored) {
    if (row == null || typeof row.currency !== "string" || row.currency === "") continue;
    if (rows.some(existing => existing.currency === row.currency)) continue;

    rows.push({
      currency: row.currency,
      value: typeof row.value === "string" && row.value !== "NaN" ? row.value : "",
      selected: row.selected === true
    });
  }

  return rows;
}

/**
 * Whether the given table can price the currency at all. Rates are regenerated
 * daily and sources add and remove codes, so a currency saved months ago may
 * simply not be quoted today.
 */
export function isPriced(rates: Rates, currency: string): boolean {
  return isUsableRate(rates[currency]);
}

function isUsableRate(rate: unknown): rate is number {
  return typeof rate === "number" && Number.isFinite(rate) && rate > 0;
}
