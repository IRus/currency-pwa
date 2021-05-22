import * as React from "react";
import {Fixer} from "./Fixer";

export function Currency({id, fixer, currency, value, onDelete, update}: {
  readonly id: number,
  readonly fixer: Fixer
  readonly currency: string,
  readonly value: string,
  readonly onDelete: (id: number) => void,
  readonly update: (id: number, currency: string, value: string) => void,
}) {
  return (
    <div className="field has-addons">
      <p className="control">
        <span className="select">
          <select
            value={currency}
            onChange={event => update(id, event.target.value, value)}>
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
        <input
          className="input"
          type="text"
          placeholder=""
          value={value}
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
