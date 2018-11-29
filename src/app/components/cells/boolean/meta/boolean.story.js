import {withInfo} from "@storybook/addon-info";
import {withKnobs} from "@storybook/addon-knobs";
import {storiesOf} from "@storybook/react";

import React from "react";
import BooleanCell from "../BooleanCell";

storiesOf("boolean", module)
  .add("checked", () => (
    <div className="cell cell-boolean">
      <BooleanCell
        toggleCheckboxValue={() => console.log("toggledCheckboxValue")}
        cell={{value: true}}
      />
    </div>
  ))
  .add("not checked", () => (
    <div className="cell cell-boolean">
      <BooleanCell
        toggleCheckboxValue={() => console.log("toggledCheckboxValue")}
        cell={{value: false}}
      />
    </div>
  ));
