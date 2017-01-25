import React from "react";
import GenericContextMenu from "../../contextMenu/GenericContextMenu";
import TableauxConstants from "../../../constants/TableauxConstants";
import i18n from "i18next";
import listensToClickOutside from "react-onclickoutside";
const FilterModes = TableauxConstants.FilterModes;

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
    const {x, y} = this.props;
    return (
      <GenericContextMenu x={x} y={y} align={TableauxConstants.Alignments.UPPER_LEFT}
                          menuItems={
                            <div className="filter-mode-popup">
                              <div>
                                <a href="#" onClick={this.setFilterMode(FilterModes.CONTAINS)}>
                                  {i18n.t("table:filter.contains")}
                                </a>
                              </div>
                              <div>
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
  x: React.PropTypes.number.isRequired,
  y: React.PropTypes.number.isRequired,
  setFilterMode: React.PropTypes.func.isRequired,
  close: React.PropTypes.func.isRequired
};

export default FilterModePopup;