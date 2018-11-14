import {withInfo} from "@storybook/addon-info";
import {withKnobs} from "@storybook/addon-knobs";
import {storiesOf} from "@storybook/react";
import {Provider} from "react-redux";
import store from "../../../redux/store";

import _ from "lodash";
import React from "react";
import Test from "../test";

storiesOf("test", module)
  .addDecorator(story => <Provider store={store}>{story()}</Provider>)
  .add("default", () => <Test />);
