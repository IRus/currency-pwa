import * as React from "react";
import {Fixer} from "./Fixer";

export function Currency({id, fixer, currency, value, onDelete, onChangeCurrency}: {
  readonly id: number,
  readonly fixer: Fixer
  readonly currency: string,
  readonly value: number,
  readonly onDelete: (id: number) => void,
  readonly onChangeCurrency: (id: number, currency: string) => void
}) {
  return (
    <div className="field has-addons">
      <p className="control">
        <span className="select">
          <select
            value={currency}
            onChange={event => onChangeCurrency(id, event.target.value)}>
            {Object.keys(fixer).map((currency, idx) =>
              <option
                key={idx}
                value={currency}>
                {currency}
              </option>
            )}
          </select>
        </span>
      </p>
      <p className="control">
        <input className="input" type="number" placeholder=""/>
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
