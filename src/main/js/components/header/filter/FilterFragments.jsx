import React from "react";
import {branch, pure, renderNothing} from "recompose";
import i18n from "i18next";
import {either} from "../../../helpers/functools";
import classNames from "classnames";
import {FilterModes} from "../../../constants/TableauxConstants";
import f from "lodash/fp";
import FilterModePopup from "./FilterModePopup";

export const BoolInput = (props) => {
  const {value, onChangeValue} = props;
  const isYesSelected = value;
  const checkboxCss = classNames("checkbox", {"checked": isYesSelected});
  return (
    <span className="bool-input" onClick={onChangeValue}>
      <div className={checkboxCss}>
      </div>
      <div className="selection-text">
        ({i18n.t((isYesSelected) ? "common:yes" : "common:no")})
      </div>
    </span>
  );
};

export const FilterModeButton = branch(
  (props) => !props.filterColumnSelected || props.filter.filterMode === FilterModes.ROW_CONTAINS,
  renderNothing
)(
  (props) => (
    <div>
      <i className="fa fa-search" />
      <i className="fa fa-caret-down" />
    </div>
  )
);

export const FilterModePopupFrag = pure(
  (props) => {
    const active = (either(props.filter)
      .map(f.matchesProperty("filterMode", FilterModes.CONTAINS))
      .getOrElse(true))
      ? 0
      : 1;
    return (
      <FilterModePopup
        active={active}
        close={props.closePopup}
        setFilterMode={props.onChangeMode}
      />
    );
  }
);
