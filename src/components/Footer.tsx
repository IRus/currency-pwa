import * as React from "react";

export function Footer({updated}: {
  readonly updated: string
}) {
  return (
    <div className="block">
      <h2>
        <p className="has-text-centered">
          Last update: {updated}
        </p>
        <p className="has-text-centered">
          <button className="button is-ghost is-small">
            <a href="https://github.com/IRus/currency-pwa">❤︎ GitHub</a>
          </button>
        </p>
      </h2>
    </div>
  )
}
