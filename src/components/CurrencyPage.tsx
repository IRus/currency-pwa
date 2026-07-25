import * as React from "react";
import {useState} from "react";
import {Footer} from "./Footer";
import {Currencies} from "./Currencies";
import {SourceSwitch} from "./SourceSwitch";
import {CurrencyData, Source} from "./Rates";

const STORAGE_KEY = "currency_source";

export function CurrencyPage({data}: {
  readonly data: CurrencyData
}) {
  const [sourceId, setSourceId] = useState(readStoredSource);

  // Falling back to the first source covers both a stored id that no longer
  // exists and a source that failed to build on the day of the release.
  const source: Source | undefined = data.sources.find(candidate => candidate.id === sourceId) ?? data.sources[0];

  if (source === undefined) return null;

  function selectSource(id: string) {
    setSourceId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="container currency-page">
      <SourceSwitch sources={data.sources} current={source.id} onChange={selectSource}/>
      <Currencies rates={source.rates}/>
      <Footer source={source}/>
    </div>
  );
}

function readStoredSource(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch (e) {
    console.error(e);
    return "";
  }
}
