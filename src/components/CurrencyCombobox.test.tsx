import * as React from "react";
import {afterEach, expect, it, vi} from "vitest";
import {cleanup, render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {CurrencyCombobox} from "./CurrencyCombobox";

const currencies = ["USD", "EUR", "BYN", "PLN", "SEK", "AUD"];

function field(): HTMLInputElement {
  return screen.getByLabelText("Currency for row 1") as HTMLInputElement;
}

function options(): Array<string> {
  return screen.queryAllByRole("option").map(option => option.textContent ?? "");
}

function open(onChange = vi.fn()) {
  render(<CurrencyCombobox row={0} currencies={currencies} currency="USD" selected={false} onChange={onChange}/>);
  return onChange;
}

afterEach(cleanup);

it("shows the chosen code until something is typed over it", async () => {
  const user = userEvent.setup();
  open();

  expect(field().value).toBe("USD");

  await user.click(field());

  expect(options()).toHaveLength(currencies.length);
});

it("narrows the list by code", async () => {
  const user = userEvent.setup();
  open();

  await user.click(field());
  await user.keyboard("se");

  expect(options()).toEqual(["SEKSwedish Krona"]);
});

it("narrows the list by currency name", async () => {
  const user = userEvent.setup();
  open();

  await user.click(field());
  await user.keyboard("polish");

  expect(options()).toEqual(["PLNPolish Złoty"]);
});

// Nobody types ł to find the złoty.
it("narrows the list by a name spelled without its diacritics", async () => {
  const user = userEvent.setup();
  open();

  await user.click(field());
  await user.keyboard("zloty");

  expect(options()).toEqual(["PLNPolish Złoty"]);
});

it("says so when nothing matches", async () => {
  const user = userEvent.setup();
  open();

  await user.click(field());
  await user.keyboard("qqq");

  expect(options()).toEqual([]);
  expect(screen.getByText("No match")).toBeDefined();
});

it("picks what was typed with Enter", async () => {
  const user = userEvent.setup();
  const onChange = open();

  await user.click(field());
  await user.keyboard("kron{Enter}");

  expect(onChange).toHaveBeenCalledWith("SEK");
});

it("walks the list with the arrow keys", async () => {
  const user = userEvent.setup();
  const onChange = open();

  await user.click(field());
  await user.keyboard("{ArrowDown}{Enter}");

  // The list opens on the current currency, so one step down is the next one.
  expect(onChange).toHaveBeenCalledWith("EUR");
});

it("picks with the pointer", async () => {
  const user = userEvent.setup();
  const onChange = open();

  await user.click(field());
  await user.click(screen.getByText("BYN"));

  expect(onChange).toHaveBeenCalledWith("BYN");
});

it("puts the code back when the search is abandoned", async () => {
  const user = userEvent.setup();
  const onChange = open();

  await user.click(field());
  await user.keyboard("zlo{Escape}");

  expect(field().value).toBe("USD");
  expect(options()).toEqual([]);
  expect(onChange).not.toHaveBeenCalled();
});

it("puts the code back when focus leaves", async () => {
  const user = userEvent.setup();
  const onChange = open();

  await user.click(field());
  await user.keyboard("zlo");
  await user.tab();

  expect(field().value).toBe("USD");
  expect(onChange).not.toHaveBeenCalled();
});
