import { storiesOf } from "@storybook/react";

import React from "react";
import CurrencyCell from "../CurrencyCell";

storiesOf("CurrencyCell", module)
  .add("default", () => (
    <div className="cell cell-currency">
      <CurrencyCell
        cell={{ value: "test", column: { countryCodes: ["de"] } }}
        langtag="de"
      />
    </div>
  ))
  .add("editing", () => (
    <div className="cell cell-currency">
      <CurrencyCell
        cell={{ value: "test", column: { countryCodes: ["de"] } }}
        langtag="de"
        editing={true}
      />
    </div>
  ));
