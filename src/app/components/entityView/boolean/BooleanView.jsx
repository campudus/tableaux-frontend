import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { translate } from "react-i18next";
import classNames from "classnames";
import SvgIcon from "../../helperComponents/SvgIcon";
import f from "lodash/fp";

class BooleanView extends PureComponent {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired,
    funcs: PropTypes.object.isRequired,
    thisUserCantEdit: PropTypes.bool
  };

  toggleValue = event => {
    event.preventDefault();
    event.stopPropagation();
    const { actions, cell, langtag, thisUserCantEdit } = this.props;
    const { column } = cell;
    if (thisUserCantEdit) {
      return;
    }

    const valueToSet = !(column.multilanguage
      ? f.get(["value", langtag], cell)
      : f.get("value", cell));
    const newValue = column.multilanguage
      ? { [langtag]: valueToSet }
      : valueToSet;
    actions.changeCellValue({ cell, oldValue: cell.value, newValue });
  };

  toggleOnEnter = event => {
    if (event.key === "Enter") {
      this.toggleValue(event);
    }
  };

  render() {
    const { t, funcs, thisUserCantEdit, value } = this.props;
    const selected = !!value;
    const checkboxCss = classNames("checkbox", {
      checked: selected,
      disabled: thisUserCantEdit
    });

    return (
      <div
        className="item-content boolean"
        onClick={this.toggleValue}
        onKeyDown={this.toggleOnEnter}
        tabIndex={1}
        ref={el => {
          funcs.register(el);
        }}
      >
        <div className="content-wrapper">
          <div className={checkboxCss}>
            {selected ? <SvgIcon icon="check" /> : ""}
          </div>
          <div className="value">
            {`${t("current_selection")}: `}
            <div>{selected ? t("yes") : t("no")}</div>
          </div>
        </div>
        {this.props.children}
      </div>
    );
  }
}

export default translate(["common"])(BooleanView);
