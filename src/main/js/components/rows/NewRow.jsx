import React from "react";
import ActionCreator from "../../actions/ActionCreator";
import {translate} from "react-i18next";

class NewRow extends React.Component {

  addRow = () => {
    var tableId = this.props.table.getId();
    ActionCreator.addRow(tableId);
  };

  render = () => {
    var t = this.props.t;
    return (
      <div className="new-row">
        <a href="#" className="button new-row-inner" onClick={this.addRow}>
          <i className="fa fa-plus-circle">
          </i>
          <span>{t("add_new_row")}</span>
        </a>
      </div>
    );
  }
};

NewRow.propTypes = {
  table: React.PropTypes.object.isRequired
};

module.exports = translate(["table"])(NewRow);
