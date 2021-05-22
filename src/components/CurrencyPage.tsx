import * as React from "react";

export function CurrencyPage(props: Props) {
  return (
    <section className="hero is-bold is-light">
      <div className="hero-body">
        <div className="container">
          <div className="field has-addons">
            <p className="control">
              <span className="button is-static">from</span>
            </p>
            <p className="control">
          <span className="select">
            <label>
              <select id="fromCurrency">
              </select>
            </label>
          </span>
            </p>
            <p className="control">
              <span className="button is-static">to</span>
            </p>
            <p className="control">
          <span className="select">
            <label>
              <select id="toCurrency">
              </select>
            </label>
          </span>
            </p>
            <div className="control">
              <button id="swapCurrencies" type="submit" className="button is-light">⇄</button>
            </div>
          </div>
          <div className="field has-addons">
            <p className="control">
              <input id="amount" className="input is-large" type="number" placeholder="Amount" autoFocus/>
            </p>
            <p className="control">
              <span id="converted" className="button is-static is-large"/>
            </p>
          </div>
          <h2>
            <a href="https://github.com/IRus/currency-pwa">
              GitHub
            </a> • <span className="has-text-grey">
          Last update: {props.data.updated}
          </span>
          </h2>
        </div>
      </div>
    </section>
  );
}

interface Props {
  readonly data: {
    readonly updated: String,
    readonly fixer: {
      [currency: string]: number
    }
  }
}
