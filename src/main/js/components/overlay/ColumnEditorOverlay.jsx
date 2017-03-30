/*
 * Overlay class that allows to edit an editable column's title and description. Saving data is managed by a
 * handler passed from the current table's Columns instance, which created the ColumnEntry which in turn opened
 * the overlay.
 */
import React from "react";
import i18n from "i18next";

class ColumnEditorOverlay extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: this.props.name,
      description: this.props.description
    };
  }

  modify = key => evt => {
    if (evt && evt.target) {
      const new_state = {[key]: evt.target.value};
      this.setState(new_state);
      this.props.handleInput(new_state);
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
  name: React.PropTypes.string.isRequired,
  description: React.PropTypes.string,
  index: React.PropTypes.number.isRequired,
  handleInput: React.PropTypes.func.isRequired
};

export default ColumnEditorOverlay;