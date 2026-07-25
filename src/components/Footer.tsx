import * as React from "react";
import {Source} from "./Rates";

export function Footer({source}: {
  readonly source: Source
}) {
  return (
    <footer className="section">
      <p className="text-center">
        Rates from <a href={source.url} className="link">{source.name}</a>, {source.updated}
      </p>
      <a href="https://github.com/IRus/currency-pwa" className="btn btn--ghost btn--small">
        ❤︎ GitHub
      </a>
    </footer>
  )
}
