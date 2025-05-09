import i18n from "i18next";
import { Redirect, withRouter } from "react-router-dom";
import GrudHeader from "../GrudHeader";
import { switchLanguageHandler } from "../Router";

const EmptyTableView = withRouter(({ langtag, history }) => {
  const handleLanguageSwitch = langtag =>
    switchLanguageHandler(history, langtag);

  return (
    <>
      <GrudHeader
        langtag={langtag}
        handleLanguageSwitch={handleLanguageSwitch}
      />
      <div className="initial-loader">
        <div className="centered-user-message">
          {i18n.t("table:no-tables-found")}
        </div>
      </div>
      <Redirect to={`/${langtag}/tables`} />
    </>
  );
});

export default EmptyTableView;
