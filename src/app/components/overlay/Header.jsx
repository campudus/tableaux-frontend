import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import f from "lodash/fp";
import SvgIcon from "../helperComponents/SvgIcon";
import Raven from "raven-js";
import { isCell } from "../../specs/cell-spec";
import { doto } from "../../helpers/functools";
import OverlayHeadRowIdentificator from "./OverlayHeadRowIdentificator";

class Header extends PureComponent {
  static propTypes = {
    title: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.element,
      PropTypes.object // Passing a "Cell" object (containing row and table) will create a self-updateing default title
    ]).isRequired, // main headline
    context: PropTypes.string, // additional context info
    actions: PropTypes.object, // map: {[positive|negative|neutral]: [text, function]} for buttons
    components: PropTypes.element, // more components to display, e.g. search bar
    id: PropTypes.number
  };

  wrapButtonFn = (value, fn) => (...args) => {
    Raven.captureBreadcrumb({ message: "Header button: " + value });
    if (f.isFunction(fn)) {
      fn(...args);
    }
    this.props.actions.closeOverlay(this.props.id);
  };

  renderTitle = () => {
    const { title, langtag } = this.props;
    if (isCell(title)) {
      const { table, column, row } = title;
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
          cell={{ row: dataRow, column, columns }}
          langtag={langtag}
        />
      );
    } else {
      return title;
    }
  };

  render() {
    const { buttons, components, context, id, actions } = this.props;
    const cssClass = classNames("header-wrapper", {
      "with-buttons": buttons,
      "with-components": components || this.props.children
    });
    const [pos, neg, ntr] = f.props(
      ["positive", "negative", "neutral"],
      buttons
    );
    const makeButton = (className, [text, fn, dontClose]) => {
      const execAndClose = this.wrapButtonFn(className, fn);
      return (
        <a
          className={"button " + className}
          onClick={dontClose ? fn || f.noop : execAndClose}
        >
          {text}
        </a>
      );
    };
    const buttonsItem = f.isEmpty(buttons) ? null : (
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
        <div className="close-button">
          <a
            href="#"
            onClick={() => {
              actions.closeOverlay(id);
            }}
          >
            <SvgIcon
              icon="cross"
              containerClasses="color-white"
              center={true}
            />
          </a>
        </div>
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

export default Header;
