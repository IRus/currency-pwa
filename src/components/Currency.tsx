import * as React from "react";
import {CurrencyCombobox} from "./CurrencyCombobox";

export function Currency({id, currencies, currency, value, onDelete, update, selected}: {
  readonly id: number,
  readonly currencies: ReadonlyArray<string>,
  readonly currency: string,
  readonly value: string,
  readonly onDelete: (id: number) => void,
  readonly update: (id: number, currency: string, value: string) => void,
  readonly selected: boolean
}) {
  return (
    <div className="form-group form-group--inline">
      <div className="form-control-wrapper">
        <CurrencyCombobox
          id={id}
          currencies={currencies}
          currency={currency}
          selected={selected}
          onChange={picked => update(id, picked, value)}
        />
      </div>
      <div className="form-control-wrapper">
        <input
          className={selected ? "input input--primary" : "input"}
          type="text"
          inputMode="decimal"
          aria-label={`Amount in ${currency}`}
          value={value}
          autoFocus={selected}
          // Selecting on focus gives the same "start typing and it replaces"
          // feel as clearing the field, without destroying the amount on every
          // subsequent tap — which is what clearing here used to do.
          onFocus={event => event.target.select()}
          onChange={event => update(id, currency, event.target.value)}
        />
      </div>
      <div className="form-control-wrapper">
        <button
          type="button"
          aria-label={`Remove ${currency}`}
          onClick={() => onDelete(id)}
          className="btn btn--secondary-light">
          ×
        </button>
      </div>
    </div>
  )
}
