import {withInfo} from "@storybook/addon-info";
import {withKnobs} from "@storybook/addon-knobs";
import {storiesOf} from "@storybook/react";

import React from "react";
import DateCell from "../DateCell";

storiesOf("DateCell", module)
  .add("default", () => <DateCell value="2018-08-10"/>)
  .add("editing", () => <DateCell editing={true} value="2018-08-10"/>)
