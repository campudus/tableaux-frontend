import {withInfo} from "@storybook/addon-info";
import {withKnobs} from "@storybook/addon-knobs";
import {storiesOf} from "@storybook/react";

import React from "react";
import Boolean from "../boolean";


storiesOf("boolean", module)
  .add("checked", () => <Boolean toggleCheckboxValue={()=> console.log("toggledCheckboxValue")} cell={{value:true}}/>)
  .add("not checked", () => <Boolean toggleCheckboxValue={()=> console.log("toggledCheckboxValue")} cell={{value:false}}/>);
