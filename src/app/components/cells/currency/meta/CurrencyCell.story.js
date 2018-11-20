import {withInfo} from "@storybook/addon-info";
import {withKnobs} from "@storybook/addon-knobs";
import {storiesOf} from "@storybook/react";

import React from "react";
import CurrencyCell from "../CurrencyCell";

storiesOf("CurrencyCell", module)
  .add("default", () => <CurrencyCell cell={{value: "test"}} langtag="de" />)
  .add("editing", () => (
    <CurrencyCell
      cell={{value: "test", column: {countryCodes: ["de"]}}}
      langtag="de"
      editing={true}
    />
  ));
