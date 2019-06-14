import { storiesOf } from "@storybook/react";

import React from "react";
import DisabledCell from "../DisabledCell";

storiesOf("DisabledCell", module).add("default", () => (
  <div className="cell cell-disabled">
    <DisabledCell cell={{ value: "test" }} />
  </div>
));
