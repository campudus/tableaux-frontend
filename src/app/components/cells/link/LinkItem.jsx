import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import SvgIcon from "../../helperComponents/SvgIcon";
import { loadAndOpenEntityView } from "../../overlay/EntityViewOverlay";
import Empty from "../../helperComponents/emptyEntry";
import { unless } from "../../../helpers/functools";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import f from "lodash/fp";
import { doto } from "../../../helpers/functools";
import apiUrl from "../../../helpers/apiUrl";
import { canUserSeeTable } from "../../../helpers/accessManagementHelper.js";

const getCssClass = ({ isLinked, isSelected }) =>
  classNames("list-item", {
    isLinked: isLinked,
    selected: isSelected
  });

const LinkItem = props => {
  const { toTable, showToggleButton = true, userCanEdit = true } = props;
  const mainButtonClass = classNames("left", {
    linked: props.isLinked,
    "has-focus": props.selectedMode === 0
  });
  const linkButtonClass = classNames("linkButton", {
    "has-focus": props.selectedMode === 1
  });
  return (
    <div
      style={props.style}
      key={props.row.id}
      ref={props.refIfLinked}
      tabIndex={props.isLinked ? 1 : -1}
    >
      <div className={getCssClass(props)}>
        {showToggleButton && (
          <a
            href="#"
            className={
              linkButtonClass +
              " roundCorners" +
              (userCanEdit ? "" : " linkButton--disabled")
            }
            draggable={false}
            onClick={evt => props.clickHandler(props.isLinked, props.row, evt)}
          >
            {props.isLinked ? (
              <SvgIcon icon="minus" containerClasses="color-primary" />
            ) : (
              <SvgIcon icon="plus" containerClasses="color-primary" />
            )}
          </a>
        )}
        <a
          href="#"
          className={
            canUserSeeTable(toTable)
              ? linkButtonClass
              : linkButtonClass + " " + linkButtonClass + "--disabled"
          }
          draggable={false}
          onClick={() => {
            if (!canUserSeeTable(toTable)) {
              return;
            }
            props.isAttachment
              ? doto(
                  f.find(val => val.uuid === props.row.id, props.cell.value),
                  f.get("url"),
                  retrieveTranslation(props.langtag),
                  apiUrl,
                  window.open
                )
              : loadAndOpenEntityView({
                  tableId: toTable,
                  rowId: props.row.id,
                  langtag: props.langtag
                });
          }}
        >
          <SvgIcon icon="edit" containerClasses="color-primary" />
        </a>
        <div className={mainButtonClass}>
          <div draggable={false}>
            {unless(
              f.isString,
              retrieveTranslation(props.langtag),
              props.label
            ) || <Empty langtag={props.langtag} />}
          </div>
        </div>
      </div>
    </div>
  );
};

LinkItem.propTypes = {
  refIfLinked: PropTypes.func,
  clickHandler: PropTypes.func,
  isLinked: PropTypes.bool,
  isSelected: PropTypes.bool,
  row: PropTypes.object.isRequired,
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  style: PropTypes.object,
  toTable: PropTypes.number.isRequired,
  showToggleButton: PropTypes.bool,
  userCanEdit: PropTypes.bool
};

export default LinkItem;
