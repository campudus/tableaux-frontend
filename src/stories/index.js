import React from "react";
import {storiesOf} from "@storybook/react";
import {action} from "@storybook/addon-actions";
import "../main/scss/main.scss";
import TableauxConstants from "../main/js/constants/TableauxConstants";
import resources from "i18next-resource-store-loader!../main/locales/index";

import Dashboard from "../main/js/components/dashboard/DashboardView";
import TranslationStatusWidget from "../main/js/components/dashboard/translationstatus/TranslationStatusWidget";
import SupportWidget from "../main/js/components/dashboard/support/SupportWidget";
import GreeterWidget from "../main/js/components/dashboard/greeter/GreeterWidget";
import FlagWidget from "../main/js/components/dashboard/flagwidget/FlagWidget";
import i18n from "i18next";

TableauxConstants.initLangtags(["de", "en", "en-US", "fr", "it", "es", "ps", "nl", "cs"]);

i18n
  .init({
    resources,
    // we need to define just 'en' otherwise fallback doesn't work correctly since i18next tries to load the
    // json only once with the exact fallbackLng Key. So 'en-GB' doesn't work because all
    fallbackLng: "en",
    lng: TableauxConstants.DefaultLangtag,

    // have a common namespace used around the full app
    ns: ["common", "header", "table", "media", "filter", "dashboard"],
    defaultNS: "common",

    debug: false,

    interpolation: {
      escapeValue: false // not needed for react!!
    }
  });

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
