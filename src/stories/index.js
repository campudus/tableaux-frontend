import React from "react";
import {storiesOf} from "@storybook/react";
import {action} from "@storybook/addon-actions";
import "../main/scss/main.scss";

import Dashboard from "../main/js/components/dashboard/DashboardView";
import TranslationStatusWidget from "../main/js/components/dashboard/translationstatus/TranslationStatusWidget";
import SupportWidget from "../main/js/components/dashboard/support/SupportWidget";
import GreeterWidget from "../main/js/components/dashboard/greeter/GreeterWidget";
import FlagWidget from "../main/js/components/dashboard/flagwidget/FlagWidget";

storiesOf("Dashboard", module)
  .add("Full dashboard", () => <Dashboard langtag="de" />)
  .add("Greeter", () => <GreeterWidget langtag="de" />)
  .add("Translation status", () => <TranslationStatusWidget langtag="de" />)
  .add("Support", () => <SupportWidget langtag="de" />)
  .add("Important flag", () => (
    <FlagWidget langtag="de"
                flag="important"
                requestedData={{
                  tables: [
                    {id: 1, displayName: {de: "Testtabelle"}, events: 9}
                  ]
                }}
    />
  ));
