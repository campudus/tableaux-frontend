import {storiesOf} from "@storybook/react";

import React from "react";
import MetaCell from "../MetaCell";

storiesOf("MetaCell", module).add("default", () => (
  <MetaCell
    row={{id:3}}
    langtag="de"
  />
)).add("expanded", () => (
  <MetaCell
    row={{id:3}}
    langtag="de"
    expanded
  />
))
