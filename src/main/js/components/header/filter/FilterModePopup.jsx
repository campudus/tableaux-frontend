/*
 * Filter/search mode selection. When search modes from searchFunctions.js are used, adding choices to the
 * menu will make more options available immediately.
 */

import React from "react";
import GenericContextMenu from "../../contextMenu/GenericContextMenu";
import {FilterModes, Alignments} from "../../../constants/TableauxConstants";
import i18n from "i18next";
import listensToClickOutside from "react-onclickoutside";

@listensToClickOutside
class FilterModePopup extends React.Component {

  handleClickOutside() {
    this.props.close();
  };

  setFilterMode = mode_string => () => {
    this.props.setFilterMode(mode_string);
    this.props.close();
  };

  render() {
    const {x, y, active} = this.props;
    return (
      <GenericContextMenu x={x} y={y} align={Alignments.UPPER_RIGHT} noClampX={true}
                          menuItems={
                            <div className="filter-mode-popup">
                              <div className={(active === 0) ? "active" : ""} >
                                <a href="#" onClick={this.setFilterMode(FilterModes.CONTAINS)}>
                                  {i18n.t("table:filter.contains")}
                                </a>
                              </div>
                              <div className={(active === 1) ? "active" : ""}>
                                <a href="#" onClick={this.setFilterMode(FilterModes.STARTS_WITH)}>
                                  {i18n.t("table:filter.starts_with")}
                                </a>
                              </div>
                            </div>
                          } />
    )
  }
}

FilterModePopup.propTypes = {
  x: React.PropTypes.number,
  y: React.PropTypes.number,
  active: React.PropTypes.number.isRequired,
  setFilterMode: React.PropTypes.func.isRequired,
  close: React.PropTypes.func.isRequired
};

export default FilterModePopup;