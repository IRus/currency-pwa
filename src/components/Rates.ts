/**
 * How many units of each currency one unit of the source's base buys. The base
 * itself sits in the table at 1, and every conversion is a ratio, so the app
 * never has to know which currency a source anchored on.
 */
export interface Rates {
  readonly [currency: string]: number;
}

export interface Source {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly updated: string;
  readonly rates: Rates;
}

export interface CurrencyData {
  readonly sources: ReadonlyArray<Source>;
}
