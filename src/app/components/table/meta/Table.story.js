import { storiesOf } from "@storybook/react";

import React from "react";
import Table from "../Table";

const props = { table: { columns: [] }, rows: {} };

storiesOf("Table", module).add("default", () => <Table {...props} />);
