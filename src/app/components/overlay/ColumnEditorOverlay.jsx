/*
 * Overlay class that allows to edit an editable column's title and description. Saving data is managed by a
 * handler passed from the current table's Columns instance, which created the ColumnEntry which in turn opened
 * the overlay.
 */
import React, {PureComponent} from "react";
import PropTypes from "prop-types";
import i18n from "i18next";

class ColumnEditorOverlay extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      name: this.props.displayName,
      description: this.props.description
    };
  }

  modify = key => evt => {
    if (evt && evt.target) {
      const newState = {[key]: evt.target.value};
      this.setState(newState);
      this.props.handleInput(newState);
    }
  };

  render = () => {
    return (
      <div className="content-items">
        <div className="item">
          <div className="item-header">{i18n.t("table:editor.colname")}</div>
          <div className="item-description">({i18n.t("table:editor.sanity_info")})</div>
          <input type="text" autoFocus className="item-content"
            onChange={this.modify("name")}
            value={this.state.name} />
        </div>
        <div className="item">
          <div className="item-header">{i18n.t("table:editor.description")}</div>
          <textarea type="text" className="item-content"
            rows="6"
            onChange={this.modify("description")}
            value={this.state.description} />
        </div>
      </div>
    );
  };
}

ColumnEditorOverlay.propTypes = {
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  index: PropTypes.number.isRequired,
  handleInput: PropTypes.func.isRequired
};

export default ColumnEditorOverlay;
