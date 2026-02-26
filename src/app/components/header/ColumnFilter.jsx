import classNames from "classnames";
import i18n from "i18next";
import PropTypes from "prop-types";
import React from "react";
import ColumnFilterPopup, { countHiddenColumns } from "./ColumnFilterPopup";

class ColumnFilter extends React.Component {
  state = { open: false };

  togglePopup = event => {
    event.preventDefault();
    this.setState({ open: !this.state.open });
  };

  handleClickedOutside = event => {
    event.preventDefault();
    this.setState({ open: false });
  };

  render = () => {
    const {
      langtag,
      columns,
      tableId,
      columnActions,
      columnOrdering
    } = this.props;
    const { open } = this.state;
    const nHidden = countHiddenColumns(columns);

    const message = nHidden + " " + i18n.t("table:hidden_items");
    const cssClass = classNames({
      active: open,
      "has-filter": !open && nHidden > 0
    });

    const buttonClass = classNames("button", {
      "ignore-react-onclickoutside": open,
      "small-button": nHidden < 1
    });
    return (
      <div id="column-filter-wrapper" className={cssClass}>
        <button className={buttonClass} onClick={this.togglePopup}>
          <i className="fa fa-eye" />
          {nHidden > 0 ? <span className="infotext">{message}</span> : null}
        </button>
        {open ? (
          <ColumnFilterPopup
            langtag={langtag}
            tableId={tableId}
            columnActions={columnActions}
            close={this.handleClickedOutside}
            columns={this.props.columns}
            columnOrdering={columnOrdering}
          />
        ) : null}
      </div>
    );
  };
}

ColumnFilter.propTypes = {
  langtag: PropTypes.string.isRequired,
  columns: PropTypes.array.isRequired
};

export default ColumnFilter;
