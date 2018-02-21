import React from "react";
import PropTypes from "prop-types";
import {compose, pure, withHandlers} from "recompose";
import Navigation from "../header/Navigation";
import PageTitle from "../header/PageTitle";
import LanguageSwitcher from "../header/LanguageSwitcher";
import GreeterWidget from "./greeter/GreeterWidget";
import TranslationStatusWidget from "./translationstatus/TranslationStatusWidget";
import SupportWidget from "./support/SupportWidget";
import FlagWidget from "./flagwidget/FlagWidget";
import i18n from "i18next";
import App from "ampersand-app";
import FetchStatusData from "./RequestStatusData";

const WidgetColletion = ({langtag, requestedData}) => (
  <div className="widgets-wrapper">
    <div className="widgets">
      <GreeterWidget langtag={langtag} />
      <FlagWidget langtag={langtag}
                  flag="comments"
                  requestedData={requestedData}
      />
      <FlagWidget langtag={langtag}
                  flag="important"
                  requestedData={requestedData}
      />
      <FlagWidget langtag={langtag}
                  flag="needs-translation"
                  requestedData={requestedData}
      />
      <FlagWidget langtag={langtag}
                  flag="check-me"
                  requestedData={requestedData}
      />
      <FlagWidget langtag={langtag}
                  flag="postpone"
                  requestedData={requestedData}
      />
    </div>
    <TranslationStatusWidget langtag={langtag}
                             requestedData={requestedData}
    />
  </div>

);

const DashboardView = ({langtag, handleLanguageSwitch}) => (
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
);

DashboardView.propTypes = {
  langtag: PropTypes.string.isRequired
};

const enhance = compose(
  pure,
  withHandlers({
    handleLanguageSwitch: () => (langtag) => {
      App.router.history.navigate(`/${langtag}/dashboard`, {trigger: true});
    }
  })
);

export default enhance(DashboardView);
