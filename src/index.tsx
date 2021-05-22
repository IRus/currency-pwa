import * as React from "react";
import * as ReactDOM from "react-dom";
import "bulma/css/bulma.css";
import {CurrencyPage} from "./components/CurrencyPage";
import * as data from "./data.json";

ReactDOM.render(
  <CurrencyPage data={data}/>,
  document.getElementById("root")
);

