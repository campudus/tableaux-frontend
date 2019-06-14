import { storiesOf } from "@storybook/react";

import React from "react";
import AttachmentCell from "../AttachmentCell";

storiesOf("AttachmentCell", module)
  .add("default", () => (
    <div className="cell cell-attachment">
      <AttachmentCell
        cell={{ value: [{ title: { de: "attachment", en: "attachmentEN" } }] }}
        langtag="de"
      />
    </div>
  ))
  .add("editing", () => (
    <div className="cell cell-attachment">
      <AttachmentCell
        cell={{ value: [{ title: { de: "attachment", en: "attachmentEN" } }] }}
        langtag="de"
        editing
      />
    </div>
  ));
