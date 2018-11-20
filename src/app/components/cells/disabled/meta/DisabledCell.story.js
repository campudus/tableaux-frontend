import {withInfo} from "@storybook/addon-info";
import {withKnobs} from "@storybook/addon-knobs";
import {storiesOf} from "@storybook/react";

import React from "react";
import DisabledCell from "../DisabledCell";

storiesOf("DisabledCell", module)
  .add("default", () => <DisabledCell cell={{value:"test"}}/>)
