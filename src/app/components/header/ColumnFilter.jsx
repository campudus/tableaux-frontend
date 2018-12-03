import React from "react";
import ColumnFilterPopup from "./ColumnFilterPopup";
import i18n from "i18next";
import classNames from "classnames";
// import connectToAmpersand from "../helperComponents/connectToAmpersand";
import * as f from "lodash/fp";
import PropTypes from "prop-types";

// @connectToAmpersand
class ColumnFilter extends React.Component {
  state = {open: false};

  constructor(props) {
    super(props);
    this.props.columns.forEach(col => null/*this.props.watch(col)*/);
  }

  togglePopup = event => {
    event.preventDefault();
    this.setState({open: !this.state.open});
  };

  handleClickedOutside = (event) => {
    event.preventDefault();
    this.setState({open: false});
  };

  render = () => {
    const {langtag, columns} = this.props;
    const {open} = this.state;
    const nHidden = f.flow(
      f.drop(1),
      f.reject("visible"),
      f.size
    )(columns.models);
    const message = nHidden + " " + i18n.t("table:hidden_items");
    const cssClass = classNames({
      "active": open,
      "has-filter": !open && nHidden > 0
    });

    const buttonClass = classNames(
      "button",
      {"ignore-react-onclickoutside": open}
    );
    return (
      <div id="column-filter-wrapper" className={cssClass}>
        <a href="#" className={buttonClass} onClick={this.togglePopup}>
          <i className="fa fa-eye" />
          {(nHidden > 0)
            ? <span className="infotext">{message}</span>
            : null
          }
        </a>
        {(open)
          ? <ColumnFilterPopup langtag={langtag}
            close={this.handleClickedOutside}
            columns={this.props.columns}
          />
          : null
        }
      </div>
    );
  }
}

ColumnFilter.propTypes = {
  langtag: PropTypes.string.isRequired,
  columns: PropTypes.object.isRequired
};

export default ColumnFilter;
