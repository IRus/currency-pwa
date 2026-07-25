import * as React from "react";
import { createRoot } from "react-dom/client";
import {CurrencyPage} from "./components/CurrencyPage";
import {CurrencyData} from "./components/Rates";
import data from "./data.json";
import "./style.css";

const container = document.getElementById("root");
if (!container) throw new Error("Cannot mount: #root is missing from the document");

createRoot(container)
  .render(<CurrencyPage data={data as CurrencyData}/>);
