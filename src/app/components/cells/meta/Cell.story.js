import { storiesOf } from "@storybook/react";

import React from "react";
import Cell from "../Cell";

storiesOf("Cell", module).add("default", () => (
  <Cell
    cell={{
      value: "textCell",
      annotations: { translationNeeded: true },
      column: { columnId: 1 },
      kind: "text",
      isEditable: true
    }}
    langtag="de"
  />
));
