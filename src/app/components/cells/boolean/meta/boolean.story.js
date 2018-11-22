import {withInfo} from "@storybook/addon-info";
import {withKnobs} from "@storybook/addon-knobs";
import {storiesOf} from "@storybook/react";

import React from "react";
import Boolean from "../boolean";

storiesOf("boolean", module)
  .add("checked", () => (
    <div className="cell cell-boolean">
      <Boolean
        toggleCheckboxValue={() => console.log("toggledCheckboxValue")}
        cell={{value: true}}
      />
    </div>
  ))
  .add("not checked", () => (
    <div className="cell cell-boolean">
      <Boolean
        toggleCheckboxValue={() => console.log("toggledCheckboxValue")}
        cell={{value: false}}
      />
    </div>
  ));
