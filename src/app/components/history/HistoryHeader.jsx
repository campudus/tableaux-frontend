import React from "react";
import f from "lodash/fp";
import i18n from "i18next";

import { SimpleHeader } from "../overlay/Header";
import OverlayHeaderLanguageSwitcher from "../overlay/OverlayHeaderLanguageSwitcher";

const HistoryHeader = props => {
  const {
    langtag,
    sharedData: { contentLangtag },
    updateSharedData
  } = props;

  const switchLanguage = newLangtag =>
    updateSharedData(f.assoc("contentLangtag", newLangtag));

  return (
    <SimpleHeader
      langtag={langtag}
      title={
        <div className="revision-history__header">
          <i className="fa fa-history revision-history-header__icon" />
          <div className="revision-hisory-header__title">
            {i18n.t("history:history-view")}
          </div>
        </div>
      }
    >
      <OverlayHeaderLanguageSwitcher
        contentLangtag={contentLangtag || langtag}
        handleChange={switchLanguage}
        classes="revision-history-header__language-switcher"
      />
    </SimpleHeader>
  );
};

export default HistoryHeader;
