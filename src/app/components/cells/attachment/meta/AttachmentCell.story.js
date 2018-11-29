import {withInfo} from "@storybook/addon-info";
import {withKnobs} from "@storybook/addon-knobs";
import {storiesOf} from "@storybook/react";

import React from "react";
import AttachmentCell from "../AttachmentCell";
import AttachmentOverlay from "../AttachmentOverlay";

storiesOf("AttachmentCell", module)
  .add("default", () => (
    <div className="cell cell-attachment">
      <AttachmentCell
        cell={{value: [{title: {de: "attachment", en: "attachmentEN"}}]}}
        langtag="de"
      />
    </div>
  ))
  .add("editing", () => (
    <div className="cell cell-attachment">
      <AttachmentCell
        cell={{value: [{title: {de: "attachment", en: "attachmentEN"}}]}}
        langtag="de"
        editing
      />
    </div>
  ))
  // .add("overlay", () => (
  //   <AttachmentOverlay />
  // ))
