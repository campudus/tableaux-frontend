import React from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";
import classNames from "classnames";

import { canUserChangeCell } from "../../../helpers/accessManagementHelper";
import { doto, unless } from "../../../helpers/functools";
import { loadAndOpenEntityView } from "../../overlay/EntityViewOverlay";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import Empty from "../../helperComponents/emptyEntry";
import SvgIcon from "../../helperComponents/SvgIcon";
import apiUrl from "../../../helpers/apiUrl";

const MAIN_BUTTON = 0;
const LINK_BUTTON = 1;

const getCssClass = ({ isLinked, isSelected }) =>
  classNames("list-item", {
    isLinked: isLinked,
    selected: isSelected
  });

const SelectedItem = props => {
  const mainButtonClass = classNames("left", {
    linked: props.isLinked,
    "has-focus": props.selectedMode === 0
  });
  const linkButtonClass = classNames("right", {
    "has-focus": props.selectedMode === 1,
    linked: props.isLinked
  });

  const handleClick = React.useCallback(evt =>
    props.clickHandler(props.isLinked, props.row, evt)
  );
  return (
    <div
      style={props.style}
      key={props.row.id}
      ref={props.refIfLinked}
      tabIndex={props.isLinked ? 1 : -1}
    >
      <div className={getCssClass(props)}>
        <div
          className={mainButtonClass}
          onMouseEnter={props.mouseOverHandler.box(MAIN_BUTTON)}
          onClick={() => {
            props.isAttachment
              ? doto(
                  f.find(val => val.uuid === props.row.id, props.cell.value),
                  f.get("url"),
                  retrieveTranslation(props.langtag),
                  apiUrl,
                  window.open
                )
              : loadAndOpenEntityView({
                  tableId: props.cell.column.toTable,
                  rowId: props.row.id,
                  langtag: props.langtag
                });
          }}
        >
          <a href="#" draggable={false}>
            {unless(
              f.isString,
              retrieveTranslation(props.langtag),
              props.label
            ) || <Empty langtag={props.langtag} />}
          </a>
          <i className="fa fa-long-arrow-right" />
        </div>
        <a
          href="#"
          className={linkButtonClass}
          draggable={false}
          onMouseEnter={props.mouseOverHandler.box(LINK_BUTTON)}
          onClick={handleClick}
        >
          {props.isLinked ? (
            <SvgIcon icon="cross" containerClasses="color-primary" />
          ) : (
            <SvgIcon icon="check" containerClasses="color-primary" />
          )}
        </a>
      </div>
    </div>
  );
};

const PlainItem = props => {
  return (
    <div
      style={props.style}
      key={props.row.id}
      tabIndex={1}
      onMouseOver={props.mouseOverHandler.item}
      ref={props.refIfLinked}
    >
      <div className={getCssClass(props)}>
        <div className="link-label">
          {unless(
            f.isString,
            retrieveTranslation(props.langtag),
            props.label
          ) || <Empty langtag={props.langtag} />}
        </div>
      </div>
    </div>
  );
};

const LinkItem = props => {
  const Item =
    !props.isSelected || !canUserChangeCell(props.cell)
      ? PlainItem
      : SelectedItem;
  return <Item {...props} key={props.row.id} />;
};

LinkItem.propTypes = {
  mouseOverHandler: PropTypes.object.isRequired,
  refIfLinked: PropTypes.func,
  clickHandler: PropTypes.func,
  isLinked: PropTypes.bool,
  isSelected: PropTypes.bool,
  row: PropTypes.object.isRequired,
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  style: PropTypes.object
};

export default LinkItem;
