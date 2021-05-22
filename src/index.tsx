import * as React from "react";
import * as ReactDOM from "react-dom";
import {CurrencyPage} from "./components/CurrencyPage";
import * as data from "./data.json";
import "bulma/css/bulma.css";
import "./style.css";

ReactDOM.render(
  <CurrencyPage data={data}/>,
  document.getElementById("root")
);

