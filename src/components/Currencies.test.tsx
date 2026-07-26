import * as React from "react";
import {afterEach, beforeEach, expect, it} from "vitest";
import {cleanup, render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {Currencies} from "./Currencies";

const rates = {EUR: 1, USD: 1.1, BYN: 3.5};

function amountField(currency: string): HTMLInputElement {
  return screen.getByLabelText(`Amount in ${currency}`) as HTMLInputElement;
}

beforeEach(() => {
  localStorage.clear();
});

// Auto-cleanup only registers itself when the runner exposes globals, and this
// config keeps them off.
afterEach(cleanup);

it("keeps the entered amount when another field is tapped", async () => {
  const user = userEvent.setup();
  render(<Currencies rates={rates}/>);

  await user.clear(amountField("USD"));
  await user.type(amountField("USD"), "1500");
  expect(amountField("USD").value).toBe("1500");

  await user.click(amountField("EUR"));

  expect(amountField("USD").value).toBe("1500");
});

it("never renders or persists NaN while a decimal is typed", async () => {
  const user = userEvent.setup();
  render(<Currencies rates={rates}/>);

  await user.clear(amountField("USD"));
  await user.type(amountField("USD"), "0.5");

  expect(amountField("USD").value).toBe("0.5");
  expect(amountField("EUR").value).not.toContain("NaN");
  expect(localStorage.getItem("currency_data")).not.toContain("NaN");
});

it("hides a stored currency that today's rates no longer price", () => {
  localStorage.setItem("currency_data", JSON.stringify([
    {currency: "XXX", value: "100"},
    {currency: "EUR", value: "0"}
  ]));

  render(<Currencies rates={rates}/>);

  expect(screen.queryByLabelText("Amount in XXX")).toBeNull();
  expect(amountField("EUR").value).not.toContain("NaN");
  expect(localStorage.getItem("currency_data")).not.toContain("NaN");
});

it("reprices the rows against a table that replaces the one it started with", () => {
  const {rerender} = render(<Currencies rates={rates}/>);

  // 1 USD, the default first row, is 3.5/1.1 rubles at the first table.
  expect(amountField("BYN").value).toBe("3.18");

  rerender(<Currencies rates={{EUR: 1, USD: 1.1, BYN: 7}}/>);

  expect(amountField("USD").value).toBe("1");
  expect(amountField("BYN").value).toBe("6.36");
});

it("hides rows the replacing table cannot price and keeps the rest", () => {
  const {rerender} = render(<Currencies rates={rates}/>);

  rerender(<Currencies rates={{EUR: 1, USD: 1.1}}/>);

  expect(screen.queryByLabelText("Amount in BYN")).toBeNull();
  expect(amountField("USD").value).toBe("1");
  expect(amountField("EUR").value).toBe("0.91");
});

it("brings a row back when a table that prices it returns", () => {
  const {rerender} = render(<Currencies rates={rates}/>);

  rerender(<Currencies rates={{EUR: 1, USD: 1.1}}/>);
  expect(screen.queryByLabelText("Amount in BYN")).toBeNull();

  rerender(<Currencies rates={rates}/>);

  expect(amountField("BYN").value).toBe("3.18");
});

it("brings back a row added at another table, not just the defaults", async () => {
  const user = userEvent.setup();
  const {rerender} = render(<Currencies rates={{...rates, PLN: 4.3}}/>);

  await user.click(screen.getByRole("button", {name: "Add currency"}));
  expect(amountField("PLN")).toBeDefined();

  rerender(<Currencies rates={{EUR: 1, USD: 1.1}}/>);
  rerender(<Currencies rates={{...rates, PLN: 4.3}}/>);

  // Still 1 USD driving, as it was before the detour.
  expect(amountField("PLN").value).toBe("3.91");
  expect(amountField("BYN").value).toBe("3.18");
});

it("keeps the rows of a table that prices none of them", () => {
  localStorage.setItem("currency_data", JSON.stringify([
    {currency: "BYN", value: "100", selected: true}
  ]));
  const {rerender} = render(<Currencies rates={{EUR: 1, USD: 1.1}}/>);

  // Nothing of the stored selection survives here, so the card falls back to
  // what this table can show.
  expect(amountField("USD").value).toBe("1");

  rerender(<Currencies rates={rates}/>);

  expect(amountField("BYN").value).toBe("3.18");
});

it("numbers the rows on screen, not the ones behind them", () => {
  localStorage.setItem("currency_data", JSON.stringify([
    {currency: "XXX", value: "1"},
    {currency: "USD", value: "1", selected: true}
  ]));

  render(<Currencies rates={rates}/>);

  expect(screen.getByLabelText("Currency for row 1")).toBeDefined();
});

it("keeps the last visible row when the others are only hidden", async () => {
  const user = userEvent.setup();
  const {rerender} = render(<Currencies rates={rates}/>);

  rerender(<Currencies rates={{USD: 1.1}}/>);

  await user.click(screen.getByLabelText("Remove USD"));

  expect(amountField("USD")).toBeDefined();
});

it("keeps driving from the row the amount was typed into after the table changes", async () => {
  const user = userEvent.setup();
  const {rerender} = render(<Currencies rates={rates}/>);

  await user.clear(amountField("BYN"));
  await user.type(amountField("BYN"), "70");

  rerender(<Currencies rates={{EUR: 1, USD: 1.1, BYN: 7}}/>);

  expect(amountField("BYN").value).toBe("70");
  expect(amountField("EUR").value).toBe("10.00");
});
