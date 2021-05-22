import * as React from "react";
import {Footer} from "./Footer";
import {Currencies} from "./Currencies";
import {Fixer} from "./Fixer";

export function CurrencyPage({data}: {
  readonly data: {
    readonly updated: string,
    readonly fixer: Fixer
  }
}) {
  return (
    <div className="container currencies-page">
      <Currencies fixer={data.fixer}/>
      <Footer updated={data.updated}/>
    </div>
  );
}
