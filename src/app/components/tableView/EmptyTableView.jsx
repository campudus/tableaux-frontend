import i18n from "i18next";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import GrudHeader from "../GrudHeader";
import { switchLanguageHandler } from "../Router";

const EmptyTableView = ({ langtag }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const handleLanguageSwitch = langtag =>
    switchLanguageHandler(navigate, location.pathname, langtag);

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
      <Navigate to={`/${langtag}/tables`} replace />
    </>
  );
};

export default EmptyTableView;
