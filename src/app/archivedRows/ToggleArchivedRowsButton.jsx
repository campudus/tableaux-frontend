import { t } from "i18next";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SvgIcon from "../components/helperComponents/SvgIcon";
import Action from "../redux/actionCreators";
import { selectShowArchivedState } from "../redux/reducers/tableView";
import { ShowArchived } from "./helpers";

const StateCfg = {
  [ShowArchived.hide]: {
    icon: <SvgIcon icon="/img/icons/database-current.svg" />,
    trnKey: "only-unarchived"
  },
  [ShowArchived.show]: {
    icon: <SvgIcon icon="/img/icons/database-current-archived.svg" />,
    trnKey: "all"
  },
  [ShowArchived.exclusive]: {
    icon: <SvgIcon icon="/img/icons/database-archived.svg" />,
    trnKey: "only-archived"
  }
};

const Item = ({ onClick, active, content }) => {
  return (
    <button onClick={active ? undefined : onClick}>
      {content.icon}
      <span>{t(`table:archived.${content.trnKey}`)}</span>
    </button>
  );
};
const ToggleArchivedRowsButton = ({ table }) => {
  // prevent potential massive reload of archived rows
  const [mustFetchArchivedRows, setMustFetchArchivedRows] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const togglePopup = () => setShowPopup(!showPopup);

  const showArchivedMode = useSelector(selectShowArchivedState);
  const dispatch = useDispatch();
  const showArchived = mode => () => {
    dispatch(Action.setShowArchivedRows(table, mode));
    if (mustFetchArchivedRows) {
      dispatch(Action.loadAllRows(table.id, true));
      setMustFetchArchivedRows(false);
    }
  };

  const className = `filter-wrapper ${showPopup ? "active" : ""}`;

  return (
    <>
      <div className={className}>
        <button
          className="filter-popup-button button__toggle-archived-rows"
          onClick={togglePopup}
        >
          {StateCfg[showArchivedMode || ShowArchived.hide]?.icon}
        </button>
      </div>
      {showPopup ? (
        <div>
          {Object.keys(StateCfg).map(mode => (
            <Item
              key={mode}
              onClick={showArchived(mode)}
              active={mode === showArchivedMode}
              content={StateCfg[mode]}
            />
          ))}
        </div>
      ) : null}
    </>
  );
};

export default ToggleArchivedRowsButton;
