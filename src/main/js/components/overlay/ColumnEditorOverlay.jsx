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
    console.log("ColumnEditorOverlay.modify, key =", key, "evt =", evt);
    if (evt && evt.target) {
      const new_state = {[key]: evt.target.value};
      console.log("-- new_state:", new_state);
      this.setState(new_state);
      this.props.handleInput(new_state);
    }
  };

  render = () => {
    return (
      <span className="column-editor">
        <p>
          <text className="editor-big-text">{i18n.t("table:editor.colname")}</text>
          <br />
          <text>({i18n.t("table:editor.sanity_info")})</text>
          <input type="text" autoFocus className="input"
                 onChange={this.modify("name")}
                 value={this.state.name} />
        </p>
        <p>
          <text className="editor-big-text">{i18n.t("table:editor.description")}</text>
          <textarea type="text" className="input"
                    rows="6"
                    onChange={this.modify("description")}
                    value={this.state.description} />
        </p>
        </span>
    );
  };
}

ColumnEditorOverlay.propTypes = {
  name: React.PropTypes.string.isRequired,
  description: React.PropTypes.string,
  index: React.PropTypes.number.isRequired,
  handleInput: React.PropTypes.func.isRequired
};

module.exports = ColumnEditorOverlay;