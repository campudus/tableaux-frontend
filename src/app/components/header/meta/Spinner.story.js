import { storiesOf } from "@storybook/react";

import React from "react";
import Spinner from "../Spinner";

storiesOf("Spinner", module).add("default", () => <Spinner isLoading />);
