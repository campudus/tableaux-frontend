import { t } from "i18next";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SvgIcon from "../components/helperComponents/SvgIcon";
import { buildClassName } from "../helpers/buildClassName";
import { outsideClickEffect } from "../helpers/useOutsideClick";
import actionCreators from "../redux/actionCreators";
import Action from "../redux/actionCreators";
import { selectShowArchivedState } from "../redux/reducers/tableView";
import { ShowArchived } from "./helpers";

const StateCfg = {
  [ShowArchived.hide]: {
    icon: <SvgIcon icon="/img/icons/database.svg" />,
    trnKey: "hide"
  },
  [ShowArchived.show]: {
    icon: <SvgIcon icon="/img/icons/database-current-archived.svg" />,
    trnKey: "show"
  },
  [ShowArchived.exclusive]: {
    icon: <SvgIcon icon="/img/icons/database-archived.svg" />,
    trnKey: "exclusive"
  },
  [ShowArchived.linked]: {
    icon: <SvgIcon icon="/img/icons/database-current-archived.svg" />,
    trnKey: "linked"
  }
};

const Item = ({ onClick, active, content }) => {
  const cssClass = `list-item ${active ? "active" : ""}`;

  return (
    <button
      className={cssClass}
      onClick={active ? undefined : onClick}
      disabled={active}
    >
      {content.icon}
      <span>{t(`table:archived.${content.trnKey}`)}</span>
    </button>
  );
};
const ToggleArchivedRowsButton = ({ table, langtag }) => {
  // prevent potential massive reload of archived rows
  const [mustFetchArchivedRows, setMustFetchArchivedRows] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const togglePopup = () => setShowPopup(!showPopup);

  const showArchivedMode = useSelector(selectShowArchivedState);
  const dispatch = useDispatch();
  const showArchived = mode => () => {
    dispatch(Action.setShowArchivedRows(table, mode));
    if (mode !== ShowArchived.show) {
      dispatch(
        actionCreators.toggleCellSelection({ selected: false, table, langtag })
      );
    }

    if (mustFetchArchivedRows) {
      dispatch(Action.loadAllRows(table.id, true));
      setMustFetchArchivedRows(false);
    }
    setShowPopup(false);
  };

  const containerRef = useRef();
  useEffect(
    outsideClickEffect({
      shouldListen: showPopup,
      containerRef,
      onOutsideClick: () => setShowPopup(false)
    }),
    [showPopup, containerRef.current]
  );

  return (
    <div className="archive-mode-toggle__wrapper">
      <div
        className={buildClassName("archive-mode-toggle", { open: showPopup })}
      >
        <button
          className="small-button archive-mode-toggle__popup-button"
          onClick={togglePopup}
        >
          {StateCfg[showArchivedMode || ShowArchived.hide]?.icon}
        </button>
      </div>
      {showPopup ? (
        <div className="archive-mode-toggle__popup" ref={containerRef}>
          <span className="title">{t("table:archived.popup-title")}</span>
          {Object.keys(StateCfg).map(mode => {
            const active = mode === showArchivedMode;
            const isLinkedMode = mode === ShowArchived.linked;

            if (isLinkedMode && !active) {
              return null;
            } else {
              return (
                <Item
                  key={mode}
                  onClick={showArchived(mode)}
                  active={active}
                  content={StateCfg[mode]}
                />
              );
            }
          })}
        </div>
      ) : null}
    </div>
  );
};

export default ToggleArchivedRowsButton;
