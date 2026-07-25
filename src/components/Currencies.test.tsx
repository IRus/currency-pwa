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

it("drops a stored currency that today's rates no longer price", () => {
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

it("drops rows the replacing table cannot price and keeps the rest", () => {
  const {rerender} = render(<Currencies rates={rates}/>);

  rerender(<Currencies rates={{EUR: 1, USD: 1.1}}/>);

  expect(screen.queryByLabelText("Amount in BYN")).toBeNull();
  expect(amountField("USD").value).toBe("1");
  expect(amountField("EUR").value).toBe("0.91");
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
