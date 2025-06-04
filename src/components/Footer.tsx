import * as React from "react";

export function Footer({updated}: {
  readonly updated: string
}) {
  return (
    <div className="section">
      <h2>
        <p className="text-center">
          Last update: {updated}
        </p>
        <p className="text-center">
          <a href="https://github.com/IRus/currency-pwa" className="btn btn--ghost btn--small">
            ❤︎ GitHub
          </a>
        </p>
      </h2>
    </div>
  )
}
