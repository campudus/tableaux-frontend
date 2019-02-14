import { compose, pure, withHandlers, withProps } from "recompose";
import React from "react";
import i18n from "i18next";

import PropTypes from "prop-types";

import FetchStatusData from "./RequestStatusData";
import FlagWidget from "./flagwidget/FlagWidget";
import GreeterWidget from "./greeter/GreeterWidget";
import LanguageSwitcher from "../header/LanguageSwitcher";
import Navigation from "../header/Navigation";
import PageTitle from "../header/PageTitle";
import SupportWidget from "./support/SupportWidget";
import TableauxConstants from "../../constants/TableauxConstants";
import TableauxRouter from "../../router/router";
import TranslationStatusWidget from "./translationstatus/TranslationStatusWidget";
import needsApiData from "../helperComponents/needsAPIData";

const WidgetColletion = ({ langtag, requestedData }) => (
  <div className="widgets-wrapper">
    <div className="widgets">
      <GreeterWidget langtag={langtag} />
      <FlagWidget
        langtag={langtag}
        flag="comments"
        requestedData={requestedData}
      />
      <FlagWidget
        langtag={langtag}
        flag="important"
        requestedData={requestedData}
      />
      <FlagWidget
        langtag={langtag}
        flag="needs-translation"
        requestedData={requestedData}
      />
      <FlagWidget
        langtag={langtag}
        flag="check-me"
        requestedData={requestedData}
      />
      <FlagWidget
        langtag={langtag}
        flag="postpone"
        requestedData={requestedData}
      />
    </div>
    <TranslationStatusWidget langtag={langtag} requestedData={requestedData} />
  </div>
);

const DashboardView = props => {
  const { langtag, handleLanguageSwitch, requestedData } = props;

  if (requestedData) {
    TableauxConstants.initLangtags(requestedData.value);
  }

  return requestedData ? (
    <React.Fragment>
      <header>
        <Navigation langtag={langtag} />
        <div className="header-separator" />
        <PageTitle titleKey="Dashboard" />
        <LanguageSwitcher langtag={langtag} onChange={handleLanguageSwitch} />
      </header>
      <div id="dashboard-view" className={"wrapper"}>
        <FetchStatusData>
          <WidgetColletion langtag={langtag} />
        </FetchStatusData>

        <SupportWidget langtag={langtag} />
        <footer>
          <div className="footer-text">{i18n.t("dashboard:footer-text")}</div>
        </footer>
      </div>
    </React.Fragment>
  ) : null;
};

DashboardView.propTypes = {
  langtag: PropTypes.string.isRequired,
  requestedData: PropTypes.object
};

const enhance = compose(
  pure,
  withHandlers({
    handleLanguageSwitch: () => newLangtag => {
      TableauxRouter.switchLanguageHandler(newLangtag);
    }
  }),
  withProps(() => {
    return { requestUrl: "/api/system/settings/langtags" };
  }),
  needsApiData
);

export default enhance(DashboardView);
