import { withRouter, Redirect } from "react-router-dom";
import React from "react";
import i18n from "i18next";

import PropTypes from "prop-types";

import { switchLanguageHandler } from "../Router";
import FlagWidget from "./flagwidget/FlagWidget";
import GreeterWidget from "./greeter/GreeterWidget";
import GrudHeader from "../GrudHeader";
import SupportWidget from "./support/SupportWidget";
import TranslationStatusWidget from "./translationstatus/TranslationStatusWidget";
import withDashboardStatusData from "./RequestStatusData";

const WidgetColletion = withDashboardStatusData(
  ({ langtag, requestedData }) => (
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
      <TranslationStatusWidget
        langtag={langtag}
        requestedData={requestedData}
      />
      <Redirect to={`${langtag}/dashboard`} />
    </div>
  )
);

const DashboardView = props => {
  const { history, langtag } = props;
  const handleLanguageSwitch = React.useCallback(newLangtag =>
    switchLanguageHandler(history, newLangtag)
  );

  return (
    <React.Fragment>
      <GrudHeader
        pageTitleOrKey="Dashboard"
        langtag={langtag}
        handleLanguageSwitch={handleLanguageSwitch}
      />
      <div id="dashboard-view" className={"wrapper"}>
        <WidgetColletion langtag={langtag} />

        <SupportWidget langtag={langtag} />
        <footer>
          <div className="footer-text">{i18n.t("dashboard:footer-text")}</div>
        </footer>
      </div>
    </React.Fragment>
  );
};

DashboardView.propTypes = {
  langtag: PropTypes.string.isRequired,
  requestedData: PropTypes.object
};

export default withRouter(DashboardView);
