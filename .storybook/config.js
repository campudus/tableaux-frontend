import {configure} from "@storybook/react";

function loadStories() {
  const context = require.context(
    "../src/app/components",
    true,
    /\.story\.js?$/
  );
  context.keys().forEach(context);
}

configure(loadStories, module);
