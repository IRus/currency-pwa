import * as React from "react";
import {useEffect, useState} from "react";
import {Currency} from "./Currency";
import {Fixer} from "./Fixer";
import {normalize} from "./Normalize";

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

type Data = Array<{
  currency: string;
  value: string;
  selected?: boolean;
}>;

export function Currencies({fixer}: {
  readonly fixer: Fixer
}) {
  const [data, setData] = useState<Data>([]);

  useEffect(() => {
    if (data.length !== 0) return;
    function setDefault() {
      changeData(defaultCurrencies, 0)
    }

    try {
      const item = localStorage.getItem("currency_data");
      const settings: Data = JSON.parse(item ?? "[]")
      if (settings.length === 0) {
        setDefault()
      }  else {
        changeData(settings, 0)
      }
    } catch (e) {
      console.error(e);
      setDefault()
    }
  });

  function changeData(newData: Data, id: number) {
    const fromCurrency = newData[id].currency;
    const normalizedValue = normalize(newData[id].value);

    const reconciledData: Data = newData.map((row, idx) => {
      if (id === idx) {
        return {
          currency: row.currency,
          value: normalizedValue === "0" ? "" : newData[id].value,
          selected: true
        };
      } else {
        const amountCurrency = (Number(normalizedValue) / (fixer[fromCurrency] / fixer[row.currency])).toFixed(2)
        return {
          currency: row.currency,
          value: amountCurrency
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
    changeData([...data, {currency: "USD", value: ""}], 0)
  }

  function deleteCurrency(id: number) {
    if (data.length === 1) return;
    const dataCopy = [...data];
    dataCopy.splice(id, 1);
    changeData(dataCopy, 0);
  }

  function update(id: number, fromCurrency: string, value: string) {
    const dataCopy = [...data];
    dataCopy[id].currency = fromCurrency;
    dataCopy[id].value = value;

    changeData(dataCopy, id);
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
          selected={row.selected ?? false}
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

