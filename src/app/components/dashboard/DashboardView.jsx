import { compose, pure, withHandlers, withProps } from "recompose";
import React from "react";
import i18n from "i18next";

import PropTypes from "prop-types";

import FetchStatusData from "./RequestStatusData";
import FlagWidget from "./flagwidget/FlagWidget";
import GreeterWidget from "./greeter/GreeterWidget";
import GrudHeader from '../GrudHeader';
import SupportWidget from "./support/SupportWidget";
import TableauxConstants from "../../constants/TableauxConstants";
import TableauxRouter from "../../router/router";
import TranslationStatusWidget from "./translationstatus/TranslationStatusWidget";
import apiUrl from "../../helpers/apiUrl";
import needsApiData from "../helperComponents/needsAPIData";
import route from "../../helpers/apiRoutes";

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
      <GrudHeader
        pageTitle="Dashboard"
        langtag={langtag}
        handleLanguageSwitch={handleLanguageSwitch}
      />
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
    return { requestUrl: apiUrl(route.toSetting("langtags")) };
  }),
  needsApiData
);

export default enhance(DashboardView);
