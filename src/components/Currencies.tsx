import * as React from "react";
import {useEffect, useMemo, useState} from "react";
import {Currency} from "./Currency";
import {Rates} from "./Rates";
import {convert, isPriced, Row, sanitizeRows} from "./convert";

type Data = Array<Row>;

const preferredCurrencies = ["USD", "EUR", "BYN", "PLN", "DKK", "SEK", "GEL"];

export function Currencies({rates}: {
  readonly rates: Rates
}) {
  const [data, setData] = useState<Data>([]);

  const currencies = useMemo(() => Object.keys(rates), [rates]);

  // Every row the user ever picked, including the ones the current source
  // cannot price. Those are hidden rather than removed, so a source that quotes
  // fewer currencies never costs the user their selection.
  const visible = data
    .map((row, idx) => ({row, idx}))
    .filter(({row}) => isPriced(rates, row.currency));

  // Runs again whenever the table changes, which is how switching sources is
  // absorbed: the rows are re-read, the ones the new source cannot price step
  // aside, and the rest are re-converted at its rates.
  useEffect(() => {
    try {
      const item = localStorage.getItem("currency_data");
      const rows = withDefaults(sanitizeRows(JSON.parse(item ?? "[]")), rates);
      changeData(rows, driverIndex(rows, rates));
    } catch (e) {
      console.error(e);
      const rows = defaultRows(rates);
      changeData(rows, driverIndex(rows, rates));
    }
  }, [rates]);

  function changeData(newData: Data, id: number) {
    const driver = newData[id];
    if (driver === undefined) {
      setData(newData);
      return;
    }

    const fromCurrency = driver.currency;
    const rawValue = driver.value;

    const reconciledData: Data = newData.map((row, idx) => {
      if (id === idx) {
        // The edited row keeps exactly what was typed. Rewriting it mid-edit is
        // what turned "0.5" into "" -> "." -> NaN on the way through.
        return {
          currency: row.currency,
          value: rawValue,
          selected: true
        };
      } else if (!isPriced(rates, row.currency)) {
        // Nothing to convert against, so the amount is left as it was found
        // rather than blanked; the next source that quotes it reprices it.
        return {
          currency: row.currency,
          value: row.value
        };
      } else {
        return {
          currency: row.currency,
          value: convert(rawValue, fromCurrency, row.currency, rates)
        };
      }
    });

    setData(reconciledData);

    try {
      localStorage.setItem("currency_data", JSON.stringify(reconciledData));
    } catch (e) {
      console.error(e);
    }
  }

  function addCurrency() {
    // Measured against every row, hidden ones included, so the new row cannot
    // duplicate a currency that is merely out of sight at this source.
    const usedCurrencies = data.map(item => item.currency);
    const available = currencies.filter(currency => !usedCurrencies.includes(currency));

    const newCurrency = preferredCurrencies.find(currency => available.includes(currency)) ??
      available[Math.floor(Math.random() * available.length)] ??
      currencies[0];

    const newData = [...data, {currency: newCurrency, value: ""}];
    changeData(newData, firstPricedIndex(newData, rates));
  }

  function deleteCurrency(id: number) {
    if (visible.length === 1) return;
    const dataCopy = [...data];
    dataCopy.splice(id, 1);
    changeData(dataCopy, firstPricedIndex(dataCopy, rates));
  }

  function update(id: number, fromCurrency: string, value: string) {
    const dataCopy = data.map((row, idx) =>
      idx === id ? {...row, currency: fromCurrency, value} : row
    );

    changeData(dataCopy, id);
  }

  return (
    <div className="card">
      {visible.map(({row, idx}, position) =>
        <Currency
          id={idx}
          row={position}
          key={idx}
          currencies={currencies}
          currency={row.currency}
          value={row.value ?? "0"}
          selected={row.selected ?? false}
          onDelete={deleteCurrency}
          update={update}
        />
      )}
      <button
        type="button"
        onClick={addCurrency}
        className="btn btn--add-currency btn--full">
        Add currency
      </button>
    </div>
  )
}

/**
 * Keeps the card from coming up empty when the stored rows are all currencies
 * this source has never heard of. The stored rows are kept alongside the
 * additions, so the source that priced them still shows them.
 */
function withDefaults(rows: Data, rates: Rates): Data {
  if (rows.some(row => isPriced(rates, row.currency))) return rows;

  const additions = defaultRows(rates)
    .filter(addition => !rows.some(row => row.currency === addition.currency));

  return [...rows, ...additions];
}

/**
 * The row every other amount is derived from: the one the user was last typing
 * in, so switching sources leaves the amount they typed where they typed it —
 * unless this source cannot price that row, in which case the amounts have to
 * come from somewhere it can.
 */
function driverIndex(rows: Data, rates: Rates): number {
  const selected = rows.findIndex(row => row.selected === true && isPriced(rates, row.currency));
  return selected === -1 ? firstPricedIndex(rows, rates) : selected;
}

function firstPricedIndex(rows: Data, rates: Rates): number {
  const idx = rows.findIndex(row => isPriced(rates, row.currency));
  return idx === -1 ? 0 : idx;
}

/**
 * What the app opens with, and what it falls back to when the stored rows are
 * unreadable. A source that does not quote one of them simply contributes
 * fewer rows — the Bundesbank has no Belarusian ruble.
 */
function defaultRows(rates: Rates): Data {
  const available = ["USD", "EUR", "BYN"].filter(currency => isPriced(rates, currency));
  const currencies = available.length === 0 ? Object.keys(rates).slice(0, 3) : available;

  return currencies.map((currency, idx) => ({
    currency: currency,
    value: idx === 0 ? "1" : "0",
    selected: idx === 0
  }));
}
