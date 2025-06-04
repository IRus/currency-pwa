import * as React from "react";
import {Fixer} from "./Fixer";
import {getCurrencyName} from "./CurrencyNames";

export function Currency({id, fixer, currency, value, onDelete, update, selected}: {
  readonly id: number,
  readonly fixer: Fixer
  readonly currency: string,
  readonly value: string,
  readonly onDelete: (id: number) => void,
  readonly update: (id: number, currency: string, value: string) => void,
  readonly selected: boolean
}) {
  return (
    <div className="field has-addons">
      <p className="control">
        <span className={selected ? "select is-primary" : "select"}>
          <select
            value={currency}
            onChange={event => update(id, event.target.value, value)}>
            {Object.keys(fixer).map((currencyOption, idx) =>
              <option
                key={idx}
                value={currencyOption}>
                {getCurrencyName(currencyOption, currencyOption !== currency)}
              </option>
            )}
          </select>
        </span>
      </p>
      <p className="control">
        <input
          className={selected ? "input is-primary" : "input"}
          type="text"
          placeholder=""
          value={value}
          autoFocus={selected}
          onClick={event => update(id, currency, "")}
          onChange={event => update(id, currency, event.target.value)}
        />
      </p>
      <p className="control">
        <button
          onClick={() => onDelete(id)}
          className="button is-danger is-light">
          ␡
        </button>
      </p>
    </div>
  )
}
