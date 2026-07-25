import * as React from "react";
import {afterEach, beforeEach, expect, it} from "vitest";
import {cleanup, render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {Currencies} from "./Currencies";

const fixer = {EUR: 1, USD: 1.1, BYN: 3.5};

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
  render(<Currencies fixer={fixer}/>);

  await user.clear(amountField("USD"));
  await user.type(amountField("USD"), "1500");
  expect(amountField("USD").value).toBe("1500");

  await user.click(amountField("EUR"));

  expect(amountField("USD").value).toBe("1500");
});

it("never renders or persists NaN while a decimal is typed", async () => {
  const user = userEvent.setup();
  render(<Currencies fixer={fixer}/>);

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

  render(<Currencies fixer={fixer}/>);

  expect(screen.queryByLabelText("Amount in XXX")).toBeNull();
  expect(amountField("EUR").value).not.toContain("NaN");
  expect(localStorage.getItem("currency_data")).not.toContain("NaN");
});
