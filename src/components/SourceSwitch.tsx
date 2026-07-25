import * as React from "react";
import {Source} from "./Rates";

export function SourceSwitch({sources, current, onChange}: {
  readonly sources: ReadonlyArray<Source>,
  readonly current: string,
  readonly onChange: (id: string) => void
}) {
  // One source is not a choice.
  if (sources.length < 2) return null;

  return (
    <div className="switch" role="group" aria-label="Rates source">
      {sources.map(source =>
        <button
          key={source.id}
          type="button"
          aria-pressed={source.id === current}
          className={source.id === current ? "switch__option switch__option--on" : "switch__option"}
          onClick={() => onChange(source.id)}>
          {source.name}
        </button>
      )}
    </div>
  );
}
