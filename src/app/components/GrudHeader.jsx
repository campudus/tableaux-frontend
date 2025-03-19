import f from "lodash/fp";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { ConnectionStatus } from "./header/ConnectionStatus";
import LanguageSwitcher from "./header/LanguageSwitcher";
import Navigation from "./header/Navigation";
import UserMenu from "./header/UserMenu";

const GrudHeader = ({
  children,
  handleLanguageSwitch,
  langtag,
}) => {
  const connectedToBackend = useSelector(
    f.prop(["grudStatus", "connectedToBackend"])
  );
  return (
    <div className="grud-header-wrapper">
      <header className="grud-header">
        <Navigation langtag={langtag} />
        {children || <div className="header-separator" />}
        <LanguageSwitcher langtag={langtag} onChange={handleLanguageSwitch} />
        <ConnectionStatus isConnected={connectedToBackend} />
        <UserMenu langtag={langtag} />
      </header>
    </div>
  );
};

export default GrudHeader;

GrudHeader.propTypes = {
  langtag: PropTypes.string.isRequired,
  handleLanguageSwitch: PropTypes.func.isRequired
};
