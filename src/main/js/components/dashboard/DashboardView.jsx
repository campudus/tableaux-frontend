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

const DashboardView = ({langtag, handleLanguageSwitch}) => (
  <React.Fragment>
    <header>
      <Navigation langtag={langtag} />
      <PageTitle titleKey="Dashboard" />
      <LanguageSwitcher langtag={langtag} onChange={handleLanguageSwitch} languages={["de", "en", "en-US", "ch-IT"]} />
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
                      de: {
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
    </div>
  </React.Fragment>
);

DashboardView.propTypes = {
  langtag: PropTypes.string.isRequired
};

const enhance = compose(
  pure,
  withHandlers({
    handleLanguageSwitch: () => () => {
    }
  })
);

export default enhance(DashboardView);
