import * as React from "react";
import {useEffect, useState} from "react";
import {Currency} from "./Currency";
import {Fixer} from "./Fixer";
import {convert, Row, sanitizeRows} from "./convert";

const defaultCurrencies: Data = [
  {
    currency: "USD",
    value: "1",
    selected: true
  }, {
    currency: "EUR",
    value: "0"
  }, {
    currency: "BYN",
    value: "0"
  }
];

type Data = Array<Row>;

export function Currencies({fixer}: {
  readonly fixer: Fixer
}) {
  const [data, setData] = useState<Data>([]);

  useEffect(() => {
    try {
      const item = localStorage.getItem("currency_data");
      const stored = sanitizeRows(JSON.parse(item ?? "[]"), fixer);
      changeData(stored.length === 0 ? defaultCurrencies : stored, 0);
    } catch (e) {
      console.error(e);
      changeData(defaultCurrencies, 0);
    }
  }, []);

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
          value: convert(rawValue, fromCurrency, row.currency, fixer)
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
    const preferredCurrencies = ["USD", "EUR", "BYN", "PLN", "DKK", "SEK", "GEL"];
    const usedCurrencies = data.map(item => item.currency);
    const available = Object.keys(fixer).filter(currency => !usedCurrencies.includes(currency));

    const newCurrency = preferredCurrencies.find(currency => available.includes(currency)) ??
      available[Math.floor(Math.random() * available.length)] ??
      "USD";

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
          fixer={fixer}
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
