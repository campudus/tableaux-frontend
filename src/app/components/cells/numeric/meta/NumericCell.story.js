import {withInfo} from "@storybook/addon-info";
import {withKnobs} from "@storybook/addon-knobs";
import {storiesOf} from "@storybook/react";

import React from "react";
import NumericCell from "../NumericCell";

storiesOf("NumericCell", module)
  .add("default", () => (
    <NumericCell cell={{value: 7, displayValue: {de: "test"}}} langtag="de" />
  ))
  .add("editing", () => (
    <NumericCell editing cell={{value: 7, displayValue: {de: "test"}}} langtag="de" />
  ));
