import * as React from "react";
import { createRoot } from "react-dom/client";
import {CurrencyPage} from "./components/CurrencyPage";
import * as data from "./data.json";
import "./style.css";

createRoot(document.getElementById("root"))
  .render(<CurrencyPage data={data}/>);
