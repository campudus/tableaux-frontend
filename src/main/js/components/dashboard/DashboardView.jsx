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

const DashboardView = ({langtag, handleLanguageSwitch}) => (
  <React.Fragment>
    <header>
      <Navigation langtag={langtag} />
      <div className="header-separator"/>
      <PageTitle titleKey="Dashboard" />
      <LanguageSwitcher langtag={langtag} onChange={handleLanguageSwitch} />
    </header>
    <div id="dashboard-view" className={"wrapper"}>
      <div className="widgets">
        <GreeterWidget langtag={langtag} />
        <FlagWidget langtag={langtag}
                    flag="comments"
                    requestedData={{
                      tables: [
                        {id: 1, displayName: {de: "Testtabelle 1"}, events: (Math.random() * 200) | 0},
                        {id: 2, displayName: {de: "Testtabelle 2"}, events: (Math.random() * 200) | 0},
                        {id: 3, displayName: {de: "Testtabelle 3"}, events: (Math.random() * 200) | 0},
                        {id: 4, displayName: {de: "Testtabelle 5"}, events: (Math.random() * 200) | 0}
                      ]
                    }}
        />
        <FlagWidget langtag={langtag}
                    flag="important"
                    requestedData={{
                      tables: [
                        {id: 1, displayName: {de: "Testtabelle 1"}, events: (Math.random() * 200) | 0},
                        {id: 2, displayName: {de: "Testtabelle 2"}, events: (Math.random() * 200) | 0},
                        {id: 3, displayName: {de: "Testtabelle 3"}, events: (Math.random() * 200) | 0},
                        {id: 4, displayName: {de: "Testtabelle 5"}, events: (Math.random() * 200) | 0}
                      ]
                    }}
        />
        <FlagWidget langtag={langtag}
                    flag="needs-translation"
                    requestedData={{
                      pl: {
                        tables: [
                          {id: 1, displayName: {de: "Testtabelle 1"}, events: (Math.random() * 200) | 0},
                          {id: 2, displayName: {de: "Testtabelle 2"}, events: (Math.random() * 200) | 0},
                          {id: 3, displayName: {de: "Testtabelle 3"}, events: (Math.random() * 200) | 0},
                          {id: 4, displayName: {de: "Testtabelle 5"}, events: (Math.random() * 200) | 0}
                        ]
                      },
                      en: {
                        tables: [
                          {id: 1, displayName: {de: "Testtabelle-en 1"}, events: (Math.random() * 200) | 0},
                          {id: 2, displayName: {de: "Testtabelle-en 2"}, events: (Math.random() * 200) | 0},
                          {id: 3, displayName: {de: "Testtabelle-en 3"}, events: (Math.random() * 200) | 0},
                          {id: 4, displayName: {de: "Testtabelle-en 5"}, events: (Math.random() * 200) | 0}
                        ]
                      }
                    }}
        />
        <FlagWidget langtag={langtag}
                    flag="check-me"
        />
        <FlagWidget langtag={langtag}
                    flag="postpone"
                    requestedData={{
                      tables: [
                        {id: 1, displayName: {de: "Testtabelle 1"}, events: (Math.random() * 200) | 0},
                        {id: 2, displayName: {de: "Testtabelle 2"}, events: (Math.random() * 200) | 0},
                        {id: 3, displayName: {de: "Testtabelle 3"}, events: (Math.random() * 200) | 0},
                        {id: 4, displayName: {de: "Testtabelle 5"}, events: (Math.random() * 200) | 0}
                      ]
                    }}
        />
      </div>
      <TranslationStatusWidget langtag={langtag} />
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
      console.log("Set lang to", langtag)
      App.router.history.navigate(`/${langtag}/dashboard`, {trigger: true});
    }
  })
);

export default enhance(DashboardView);
