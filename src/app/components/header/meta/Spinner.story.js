import {withInfo} from "@storybook/addon-info";
import {withKnobs} from "@storybook/addon-knobs";
import {storiesOf} from "@storybook/react";

import React from "react";
import Spinner from "../Spinner";

storiesOf("Spinner", module).add("default", () => (
    <Spinner isLoading/>
));
