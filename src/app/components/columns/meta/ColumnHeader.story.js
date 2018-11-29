import {storiesOf} from "@storybook/react";

import React from "react";
import ColumnHeader from "../ColumnHeader";

storiesOf("ColumnHeader", module).add("default", () => (
  <div class="tableaux-table">
    <ColumnHeader
      column={{
        name: "test",
        displayName: {en: "test"},
        kind: "text",
        description: {en: "testDesc"}
      }}
      langtag="en"
    />
  </div>
));
