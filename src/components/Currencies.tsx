import * as React from "react";
import {useEffect, useMemo, useState} from "react";
import {Currency} from "./Currency";
import {Rates} from "./Rates";
import {convert, Row, sanitizeRows} from "./convert";

type Data = Array<Row>;

const preferredCurrencies = ["USD", "EUR", "BYN", "PLN", "DKK", "SEK", "GEL"];

export function Currencies({rates}: {
  readonly rates: Rates
}) {
  const [data, setData] = useState<Data>([]);

  const currencies = useMemo(() => Object.keys(rates), [rates]);

  // Runs again whenever the table changes, which is how switching sources is
  // absorbed: the rows are re-read, the ones the new source cannot price are
  // dropped, and the rest are re-converted at its rates.
  useEffect(() => {
    try {
      const item = localStorage.getItem("currency_data");
      const stored = sanitizeRows(JSON.parse(item ?? "[]"), rates);
      const rows = stored.length === 0 ? defaultRows(rates) : stored;
      // Driving from the row the user was last in, so switching sources leaves
      // the amount they typed where they typed it.
      changeData(rows, Math.max(rows.findIndex(row => row.selected), 0));
    } catch (e) {
      console.error(e);
      changeData(defaultRows(rates), 0);
    }
  }, [rates]);

  function changeData(newData: Data, id: number) {
    const fromCurrency = newData[id].currency;
    const rawValue = newData[id].value;

    const reconciledData: Data = newData.map((row, idx) => {
      if (id === idx) {
        // The edited row keeps exactly what was typed. Rewriting it mid-edit is
        // what turned "0.5" into "" -> "." -> NaN on the way through.
        return {
          currency: row.currency,
          value: rawValue,
          selected: true
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
    const usedCurrencies = data.map(item => item.currency);
    const available = currencies.filter(currency => !usedCurrencies.includes(currency));

    const newCurrency = preferredCurrencies.find(currency => available.includes(currency)) ??
      available[Math.floor(Math.random() * available.length)] ??
      currencies[0];

    changeData([...data, {currency: newCurrency, value: ""}], 0);
  }

  function deleteCurrency(id: number) {
    if (data.length === 1) return;
    const dataCopy = [...data];
    dataCopy.splice(id, 1);
    changeData(dataCopy, 0);
  }

  function update(id: number, fromCurrency: string, value: string) {
    const dataCopy = data.map((row, idx) =>
      idx === id ? {...row, currency: fromCurrency, value} : row
    );

    changeData(dataCopy, id);
  }

  return (
    <div className="card">
      {data.map((row, idx) =>
        <Currency
          id={idx}
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
 * What the app opens with, and what it falls back to when the stored rows are
 * unreadable. A source that does not quote one of them simply contributes
 * fewer rows — the Bundesbank has no Belarusian ruble.
 */
function defaultRows(rates: Rates): Data {
  const available = ["USD", "EUR", "BYN"].filter(currency => rates[currency] !== undefined);
  const currencies = available.length === 0 ? Object.keys(rates).slice(0, 3) : available;

  return currencies.map((currency, idx) => ({
    currency: currency,
    value: idx === 0 ? "1" : "0",
    selected: idx === 0
  }));
}
