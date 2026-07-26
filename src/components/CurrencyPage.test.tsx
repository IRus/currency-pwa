import * as React from "react";
import {afterEach, beforeEach, expect, it} from "vitest";
import {cleanup, render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {CurrencyPage} from "./CurrencyPage";
import {CurrencyData} from "./Rates";

const data: CurrencyData = {
  sources: [
    {
      id: "fixer",
      name: "Fixer.io",
      url: "https://fixer.io/",
      updated: "July 26, 2026",
      rates: {EUR: 1, USD: 1.1, BYN: 3.5}
    },
    {
      id: "nbrb",
      name: "NBRB",
      url: "https://www.nbrb.by/",
      updated: "July 25, 2026",
      rates: {BYN: 1, USD: 1 / 7, EUR: 1 / 8}
    }
  ]
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(cleanup);

it("opens on the first source", () => {
  render(<CurrencyPage data={data}/>);

  expect(screen.getByRole("button", {name: "Fixer.io"}).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByText(/July 26, 2026/)).toBeDefined();
});

it("reprices everything when another source is picked", async () => {
  const user = userEvent.setup();
  render(<CurrencyPage data={data}/>);

  expect((screen.getByLabelText("Amount in BYN") as HTMLInputElement).value).toBe("3.18");

  await user.click(screen.getByRole("button", {name: "NBRB"}));

  expect((screen.getByLabelText("Amount in BYN") as HTMLInputElement).value).toBe("7.00");
  expect(screen.getByText(/July 25, 2026/)).toBeDefined();
});

it("keeps a currency a detour through another source cannot price", async () => {
  const user = userEvent.setup();
  const narrow = {...data.sources[1], rates: {BYN: 1, USD: 1 / 7}};
  render(<CurrencyPage data={{sources: [data.sources[0], narrow]}}/>);

  await user.click(screen.getByRole("button", {name: "NBRB"}));
  expect(screen.queryByLabelText("Amount in EUR")).toBeNull();

  await user.click(screen.getByRole("button", {name: "Fixer.io"}));

  expect((screen.getByLabelText("Amount in EUR") as HTMLInputElement).value).toBe("0.91");
});

it("comes back to the source that was picked last time", () => {
  localStorage.setItem("currency_source", "nbrb");

  render(<CurrencyPage data={data}/>);

  expect(screen.getByRole("button", {name: "NBRB"}).getAttribute("aria-pressed")).toBe("true");
});

it("remembers the source across a reload", async () => {
  const user = userEvent.setup();
  const {unmount} = render(<CurrencyPage data={data}/>);

  await user.click(screen.getByRole("button", {name: "NBRB"}));
  unmount();

  render(<CurrencyPage data={data}/>);

  expect(screen.getByRole("button", {name: "NBRB"}).getAttribute("aria-pressed")).toBe("true");
});

it("falls back to the first source when the stored one is gone", () => {
  localStorage.setItem("currency_source", "tut.by");

  render(<CurrencyPage data={data}/>);

  expect(screen.getByRole("button", {name: "Fixer.io"}).getAttribute("aria-pressed")).toBe("true");
});

it("offers no switch when the build produced a single source", () => {
  render(<CurrencyPage data={{sources: [data.sources[0]]}}/>);

  expect(screen.queryByRole("group", {name: "Rates source"})).toBeNull();
  expect(screen.getByLabelText("Amount in USD")).toBeDefined();
});
