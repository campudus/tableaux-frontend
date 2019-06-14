import { storiesOf } from "@storybook/react";

import React from "react";
import IdentifierCell from "../IdentifierCell";

storiesOf("IdentifierCell", module).add("default", () => (
  <div className="cell">
    <IdentifierCell
      cell={{ value: "test", displayValue: { de: "test" } }}
      langtag="de"
    />
  </div>
));
