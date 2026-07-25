import * as React from "react";

export function Footer({updated}: {
  readonly updated: string
}) {
  return (
    <footer className="section">
      <p className="text-center">
        Rates from {updated}
      </p>
      <a href="https://github.com/IRus/currency-pwa" className="btn btn--ghost btn--small">
        ❤︎ GitHub
      </a>
    </footer>
  )
}
