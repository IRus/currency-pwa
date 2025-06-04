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
    <div className="form-group form-group--inline">
      <div className="form-control-wrapper">
        <div className={selected ? "select select--primary" : "select"}>
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
        </div>
      </div>
      <div className="form-control-wrapper">
        <input
          className={selected ? "input input--primary" : "input"}
          type="text"
          placeholder=""
          value={value}
          autoFocus={selected}
          onClick={event => update(id, currency, "")}
          onChange={event => update(id, currency, event.target.value)}
        />
      </div>
      <div className="form-control-wrapper">
        <button
          onClick={() => onDelete(id)}
          className="btn btn--secondary-light">
          ␡
        </button>
      </div>
    </div>
  )
}
