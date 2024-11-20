import React, { PureComponent } from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";
import classNames from "classnames";

import { doto } from "../../helpers/functools";
import { isCell } from "../../specs/cell-spec";
import OverlayHeadRowIdentificator from "./OverlayHeadRowIdentificator";
import ReduxAction from "../../redux/actionCreators";
import SvgIcon from "../helperComponents/SvgIcon";
import store from "../../redux/store";

class Header extends PureComponent {
  wrapButtonFn = (value, fn) => (...args) => {
    if (f.isFunction(fn)) {
      fn(...args);
    }
    this.props.actions.closeOverlay(this.props.id);
  };

  renderTitle = () => {
    const { title, langtag, cell } = this.props;
    const getLanguage = () =>
      f.get(["props", "sharedData", "contentLanguage"], this) || langtag;
    const cellOrTitle = isCell(cell) ? cell : isCell(title) ? title : null;
    if (cellOrTitle) {
      const { table, row } = cellOrTitle;
      const [tableId, rowId] = [table.id, row.id];
      const [columns, rows] = doto(
        this.props.grudData,
        f.pick(["columns", "rows"]),
        f.map(f.prop([tableId, "data"]))
      );
      // Don't use the - possibly outdated - data from the time the
      // overlay was opened, but look up the current row values in
      // the redux state
      const dataRow = f.find(f.propEq("id", rowId), rows);
      return (
        <OverlayHeadRowIdentificator
          cell={{ ...cellOrTitle, row: dataRow, columns }}
          langtag={getLanguage()}
        />
      );
    } else {
      return title;
    }
  };

  render() {
    const { buttonActions, components, context, id, actions } = this.props;
    const cssClass = classNames("header-wrapper", {
      "with-buttons": buttonActions,
      "with-components": components || this.props.children
    });
    const [pos, neg, ntr] = f.props(
      ["positive", "negative", "neutral"],
      buttonActions
    );
    const makeButton = (className, [text, fn, dontClose]) => {
      const execAndClose = this.wrapButtonFn(className, fn);
      return (
        <button
          className={"button " + className}
          onClick={dontClose ? fn || f.noop : execAndClose}
        >
          {text}
        </button>
      );
    };
    const buttonsItem = f.isEmpty(buttonActions) ? null : (
      <div className="action-buttons">
        {neg ? makeButton("negative", neg) : null}
        {ntr ? makeButton("neutral", ntr) : null}
        {pos ? makeButton("positive", pos) : null}
      </div>
    );

    const children = f.flow(
      f.get(["props", "children"]),
      f.defaultTo([components]),
      f.compact
    )(components);

    return (
      <div className={cssClass}>
        <button
          className="close-button"
          onClick={() => {
            actions.closeOverlay(id);
          }}
        >
          <SvgIcon icon="cross" containerClasses="color-white" center={true} />
        </button>

        <div className="labels">
          <div className="context-info">{context || "Action"}</div>
          <div className="title">{this.renderTitle()}</div>
        </div>
        {buttonsItem}
        {children.map((el, idx) =>
          React.cloneElement(el, { ...this.props, key: idx })
        )}
        {this.props.children}
      </div>
    );
  }
}

export const SimpleHeader = props => {
  const { title, id, cssClass = "" } = props;
  return (
    <div className={"header-wrapper " + cssClass}>
      <button
        className="close-button"
        onClick={() => {
          store.dispatch(ReduxAction.closeOverlay(id));
        }}
      >
        <SvgIcon icon="cross" containerClasses="color-white" />
      </button>
      <div className="labels">
        <div className="title">{title}</div>
      </div>
      {props.children}
    </div>
  );
};

export default Header;

Header.propTypes = {
  title: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
    PropTypes.object // Passing a "Cell" object (containing row and table) will create a self-updateing default title
  ]),
  context: PropTypes.string, // additional context info
  actions: PropTypes.object, // map: {[positive|negative|neutral]: [text, function]} for buttons
  components: PropTypes.element, // more components to display, e.g. search bar
  id: PropTypes.number
};
