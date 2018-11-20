import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import SvgIcon from "../../helperComponents/SvgIcon";
import {loadAndOpenEntityView} from "../../overlay/EntityViewOverlay";
import * as f from "lodash/fp";
import Empty from "../../helperComponents/emptyEntry";

const getLinkLabel = (row, langtag) => {
  // const cell = row.cells.at(0);
  // return cell.displayValue[langtag] || cell.displayValue[FallbackLanguage];
  return f.get(["displayValue", langtag], row) || <Empty/>;
};

const MAIN_BUTTON = 0;
const LINK_BUTTON = 1;

const getCssClass = ({isLinked, isSelected}) => classNames("list-item",
  {
    "isLinked": isLinked,
    "selected": isSelected
  }
);

const SelectedItem = props => {
  const mainButtonClass = classNames("left", {
    "linked": props.isLinked,
    "has-focus": props.selectedMode === 0
  });
  const linkButtonClass = classNames("right",
    {
      "has-focus": props.selectedMode === 1,
      "linked": props.isLinked
    });
  return (
    <div style={props.style} key={props.row.id} ref={props.refIfLinked} tabIndex={(props.isLinked) ? 1 : -1}>
      <div className={getCssClass(props)}>
        <div className={mainButtonClass}
          onMouseEnter={props.mouseOverHandler.box(MAIN_BUTTON)}
          onClick={evt => props.clickHandler(props.isLinked, props.row, evt)}
        >
          <a href="#" draggable={false}>
            {getLinkLabel(props.row, props.langtag)}
          </a>
          {(props.isLinked)
            ? <SvgIcon icon="cross" containerClasses="color-primary" />
            : <SvgIcon icon="check" containerClasses="color-primary" />
          }
        </div>
        <a href="#" className={linkButtonClass} draggable={false}
          onMouseEnter={props.mouseOverHandler.box(LINK_BUTTON)}
          onClick={() => {
            loadAndOpenEntityView({
              tables: props.cell.tables,
              tableId: props.cell.column.toTable,
              rowId: props.row.id
            }, props.langtag);
          }}
        >
          <i className="fa fa-long-arrow-right" />
        </a>
      </div>
    </div>
  );
};

const PlainItem = props => {
  return (
    <div style={props.style} key={props.row.id} tabIndex={1}
      onMouseOver={props.mouseOverHandler.item}
      ref={props.refIfLinked}
    >
      <div className={getCssClass(props)}>
        <div className="link-label">
          {getLinkLabel(props.row, props.langtag)}
        </div>
      </div>
    </div>
  );
};

const LinkItem = props => {
  const Item = (props.isSelected)
    ? SelectedItem
    : PlainItem;
  return <Item {...props} key={props.row.id} />;
};

LinkItem.propTypes = {
  mouseOverHandler: PropTypes.object.isRequired,
  refIfLinked: PropTypes.func.isRequired,
  clickHandler: PropTypes.func,
  isLinked: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool.isRequired,
  row: PropTypes.object.isRequired,
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  style: PropTypes.object
};

export default LinkItem;
