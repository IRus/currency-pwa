import * as React from "react";
import {useEffect, useId, useRef, useState} from "react";
import {currencyNames} from "./CurrencyNames";

/**
 * Picks a currency by typing at it.
 *
 * A native <select> is fine for the thirty codes a central bank publishes and
 * hopeless for the hundred and seventy fixer.io does: finding SEK means
 * scrolling past everything. This is the same control with a text field in
 * front of it — type "kron", "SEK" or "swed" and the list narrows.
 */
export function CurrencyCombobox({id, currencies, currency, selected, onChange}: {
  readonly id: number,
  readonly currencies: ReadonlyArray<string>,
  readonly currency: string,
  readonly selected: boolean,
  readonly onChange: (currency: string) => void
}) {
  // null while the field is showing the chosen code rather than something being
  // typed over it. Keeping the two apart is what lets Escape and blur put the
  // code back without remembering it separately.
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const listId = `${useId()}-currencies`;
  const listRef = useRef<HTMLUListElement>(null);

  const matches = match(currencies, query);
  const active = matches[highlighted];

  useEffect(() => {
    if (!open) return;
    // scrollIntoView is not implemented in jsdom, and a keyboard walk down the
    // list must not take the tests with it.
    listRef.current?.children[highlighted]?.scrollIntoView?.({block: "nearest"});
  }, [open, highlighted]);

  function show() {
    setOpen(true);
    setHighlighted(Math.max(matches.indexOf(currency), 0));
  }

  function hide() {
    setOpen(false);
    setQuery(null);
  }

  function commit(picked: string | undefined) {
    if (picked === undefined) return;
    if (picked !== currency) onChange(picked);
    hide();
  }

  function moveHighlight(step: number) {
    if (!open) {
      show();
      return;
    }
    if (matches.length === 0) return;
    setHighlighted((highlighted + step + matches.length) % matches.length);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveHighlight(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveHighlight(-1);
        break;
      case "Enter":
        if (!open) break;
        event.preventDefault();
        commit(active);
        break;
      case "Escape":
        if (!open) break;
        event.preventDefault();
        hide();
        break;
      case "Tab":
        hide();
        break;
    }
  }

  return (
    <div className={selected ? "combo combo--primary" : "combo"}>
      <input
        className="combo__input"
        type="text"
        role="combobox"
        aria-label={`Currency for row ${id + 1}`}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active !== undefined ? `${listId}-${active}` : undefined}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={query ?? currency}
        // Selecting on focus makes the first keystroke replace the code rather
        // than land next to it, the same way the amount field behaves.
        onFocus={event => {
          event.target.select();
          show();
        }}
        onBlur={hide}
        onChange={event => {
          setQuery(event.target.value);
          setOpen(true);
          setHighlighted(0);
        }}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul className="combo__list" id={listId} role="listbox" ref={listRef}>
          {matches.map((code, index) =>
            <li
              key={code}
              id={`${listId}-${code}`}
              role="option"
              aria-selected={code === currency}
              className={index === highlighted ? "combo__option combo__option--active" : "combo__option"}
              // mousedown, not click: click arrives after blur has already put
              // the old code back and closed the list out from under the cursor.
              onMouseDown={event => {
                event.preventDefault();
                commit(code);
              }}
              onMouseEnter={() => setHighlighted(index)}>
              <span className="combo__code">{code}</span>
              <span className="combo__name">{currencyNames[code] ?? ""}</span>
            </li>
          )}
          {matches.length === 0 && <li className="combo__empty">No match</li>}
        </ul>
      )}
    </div>
  );
}

/**
 * Codes that start with what was typed come first, then anything whose name
 * contains it, so "us" leads with USD and still offers the Australian dollar
 * further down.
 */
function match(currencies: ReadonlyArray<string>, query: string | null): Array<string> {
  const needle = fold(query ?? "").trim();
  if (needle === "") return [...currencies];

  const byCode: Array<string> = [];
  const byName: Array<string> = [];

  for (const code of currencies) {
    if (code.toLowerCase().startsWith(needle)) byCode.push(code);
    else if ((foldedNames.get(code) ?? "").includes(needle)) byName.push(code);
  }

  return [...byCode, ...byName];
}

/**
 * Nobody reaches for the ł key to find the Polish złoty. Accents come off with
 * NFD, but a stroked letter is a letter in its own right and decomposes into
 * itself, so those are spelled out.
 */
const strokes: Record<string, string> = {"ł": "l", "đ": "d", "ʻ": ""};

function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[łđʻ]/g, character => strokes[character] ?? character);
}

const foldedNames = new Map(
  Object.entries(currencyNames).map(([code, name]) => [code, fold(name)])
);
