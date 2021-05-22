import * as React from "react";
import {useEffect, useState} from "react";
import {Currency} from "./Currency";
import {Fixer} from "./Fixer";

const defaultCurrencies = ["USD", "EUR", "BYN"];

export function Currencies({fixer}: {
  readonly fixer: Fixer
}) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (selected.length !== 0) return;
    function setDefault() {
      setSelected(defaultCurrencies)
    }

    try {
      const item = localStorage.getItem("currencies");
      const settings: string[] = JSON.parse(item ?? "[]")
      if (settings.length === 0) {
        setDefault()
      }  else {
        setSelected((settings))
      }
    } catch (e) {
      console.error(e);
      setDefault()
    }
  });

  function changeSelected(selected: string[]) {
    setSelected(selected);
    try {
      localStorage.setItem("currencies", JSON.stringify(selected));
    } catch (e) {
      console.error(e);
    }
  }

  function addCurrency() {
    changeSelected([...selected, "USD"])
  }

  function deleteCurrency(id: number) {
    const selectedCopy = [...selected];
    selectedCopy.splice(id, 1);
    changeSelected(selectedCopy);
  }

  function updateCurrency(id: number, currency: string) {
    const selectedCopy = [...selected];
    selectedCopy[id] = currency;
    changeSelected(selectedCopy)
  }

  const value = 1

  return (
    <div className="box">
      {selected.map((currency, idx) =>
        <Currency
          id={idx}
          key={idx}
          fixer={fixer}
          currency={currency}
          value={value}
          onDelete={deleteCurrency}
          onChangeCurrency={updateCurrency}
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
