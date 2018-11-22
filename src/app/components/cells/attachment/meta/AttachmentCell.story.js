import {withInfo} from "@storybook/addon-info";
import {withKnobs} from "@storybook/addon-knobs";
import {storiesOf} from "@storybook/react";

import React from "react";
import AttachmentCell from "../AttachmentCell";


storiesOf("AttachmentCell", module)
  .add("default", () => (<div className="cell cell-attachment"><AttachmentCell cell={{value:"attachment"}}/></div>))
  // .add("not checked", () => <Boolean toggleCheckboxValue={()=> console.log("toggledCheckboxValue")} cell={{value:false}}/>);
