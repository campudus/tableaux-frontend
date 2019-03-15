import { storiesOf } from "@storybook/react";

import React from "react";
import TextCell from "../TextCell";

storiesOf("TextCell", module).add("default", () => (
  <div className="cell cell-text">
    <TextCell
      cell={{ value: "test", displayValue: { de: "test" } }}
      langtag="de"
    />
  </div>
));
