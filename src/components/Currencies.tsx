import * as React from "react";
import {useEffect, useState} from "react";
import {Currency} from "./Currency";
import {Fixer} from "./Fixer";

const defaultCurrencies: Data = [
  {
    currency: "USD",
    value: "0"
  }, {
    currency: "EUR",
    value: "0"
  }, {
    currency: "BYN",
    value: "0"
  }
];

type Data = Array<{
  currency: string;
  value: string;
}>;

export function Currencies({fixer}: {
  readonly fixer: Fixer
}) {
  const [data, setData] = useState<Data>([]);

  useEffect(() => {
    if (data.length !== 0) return;
    function setDefault() {
      setData(defaultCurrencies)
    }

    try {
      const item = localStorage.getItem("currency_data");
      const settings: Data = JSON.parse(item ?? "[]")
      if (settings.length === 0) {
        setDefault()
      }  else {
        setData(settings)
      }
    } catch (e) {
      console.error(e);
      setDefault()
    }
  });

  function changeData(newData: Data) {
    setData(newData);
    try {
      localStorage.setItem("currency_data", JSON.stringify(newData));
    } catch (e) {
      console.error(e);
    }
  }

  function addCurrency() {
    changeData([...data, {currency: "USD", value: ""}])
  }

  function deleteCurrency(id: number) {
    const dataCopy = [...data];
    dataCopy.splice(id, 1);
    changeData(dataCopy);
  }

  function update(id: number, fromCurrency: string, value: string) {
    const normalizedValue = normalize(value);
    const dataCopy = [...data];
    dataCopy[id].currency = fromCurrency;

    const newData: Data = dataCopy.map((row, idx) => {
      if (id === idx) {
        return {
          currency: row.currency,
          value: normalizedValue === "0" ? "" : value
        };
      } else {
        const amountCurrency = (Number(normalizedValue) / (fixer[fromCurrency] / fixer[row.currency])).toFixed(2)
        return {
          currency: row.currency,
          value: amountCurrency
        };
      }
    });

    changeData(newData);
  }

  return (
    <div className="box">
      {data.map((row, idx) =>
        <Currency
          id={idx}
          key={idx}
          fixer={fixer}
          currency={row.currency}
          value={row.value ?? "0"}
          onDelete={deleteCurrency}
          update={update}
        />
      )}
      <button
        onClick={addCurrency}
        className="button add-currency">
        Add currency
      </button>
    </div>
  )
}

const inputLookup = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  ",": ".",
  ".": ".",
  " ": ""
}

function normalize(input: string): string {
  return input.toString()
    .split("")
    .map(c => inputLookup[c] ?? "")
    .join("")
}
