import { withInfo } from "@storybook/addon-info";
import { withKnobs } from "@storybook/addon-knobs";
import { storiesOf } from "@storybook/react";

import React from "react";
import LinkCell from "../LinkCell";

storiesOf("LinkCell", module)
  .add("default", () => (
    <div className="cell cell-link">
      <LinkCell
        cell={{
          value: [{ value: ["test1, test2"], id: 14 }],
          displayValue: [{ en: "test1 test2" }]
        }}
        langtag="en"
      />
    </div>
  ))
  .add("editing", () => (
    <div className="cell cell-link">
      <LinkCell
        cell={{
          value: [{ value: ["test1, test2"], id: 14 }],
          displayValue: [{ en: "test1 test2" }]
        }}
        editing
        langtag="en"
      />
    </div>
  ));
