import { storiesOf } from "@storybook/react";

import React from "react";
import DateCell from "../DateCell";

storiesOf("DateCell", module)
  .add("default", () => (
    <div className="cell cell-date">
      <DateCell value="2018-08-10" />
    </div>
  ))
  .add("editing", () => (
    <div className="cell cell-date-editing">
      <DateCell value="2018-08-10" editing={true} />
    </div>
  ));
