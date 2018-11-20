import {withInfo} from "@storybook/addon-info";
import {withKnobs} from "@storybook/addon-knobs";
import {storiesOf} from "@storybook/react";

import React from "react";
import AttachmentCell from "../AttachmentCell";


storiesOf("AttachmentCell", module)
  .add("default", () => <AttachmentCell cell={{value:"attachment"}}/>)
  // .add("not checked", () => <Boolean toggleCheckboxValue={()=> console.log("toggledCheckboxValue")} cell={{value:false}}/>);
