/*
 * Menu entry for the TableSettingsPopup
 * Displays a menu entry with localized text, turns into input when clicked.
 * Input value gets saved as current locale display name when input loses focus or recieves "Enter" key.
 * Aborts input on "Escape" key.
 */
import React, { PureComponent } from "react";
import i18n from "i18next";
import TableauxConstants from "../../../constants/TableauxConstants";
import * as f from "lodash/fp";
// import ActionCreator from "../../../actions/ActionCreator";
import PropTypes from "prop-types";

class NameEditor extends PureComponent {
  constructor(props) {
    super(props);
    this.saveAndClose = f.flow(
      this.stopEditing,
      this.saveTableName
    );
    this.state = {
      active: false,
      name: null
    };
  }

  startEditing = evt => {
    this.setState({
      active: true,
      name: this.getTableDisplayName()
    });
    evt.stopPropagation();
  };

  handleInput = evt => {
    if (evt && evt.key) {
      f.cond([
        [f.eq("Enter"), this.saveAndClose],
        [f.eq("Escape"), this.stopEditing],
        [f.stubTrue, () => null]
      ])(evt.key);
    }
  };

  saveAndClose = function() {}; // composed by constructor

  getTableDisplayName = () => {
    const {
      table: { displayName, name },
      langtag
    } = this.props;
    return (
      displayName[langtag] ||
      displayName[TableauxConstants.FallbackLanguage] ||
      name
    );
  };

  handleTextChange = evt => {
    if (evt && evt.target) {
      this.setState({ name: evt.target.value });
    }
  };

  stopEditing = () => {
    this.setState({ active: false });
  };

  saveTableName = () => {
    const { name } = this.state;
    if (this.getTableDisplayName() === name) {
      return;
    } // guardian

    const { table, langtag } = this.props;
    const patchObj = { displayName: { [langtag]: name } };
    table.save(patchObj, {
      patch: true,
      wait: true,
      success: () => null //ActionCreator.refreshTableNames()
    });
  };

  renderOpenInput = () => {
    return (
      <input
        type="text"
        className="input"
        autoFocus
        onChange={this.handleTextChange}
        onKeyDown={this.handleInput}
        value={this.state.name}
        onBlur={this.saveAndClose}
      />
    );
  };

  render = () => {
    const { active } = this.state;
    return (
      <a
        href="#"
        id="table-rename-wrapper"
        className={active ? "active" : ""}
        onClick={this.startEditing}
      >
        {active ? (
          this.renderOpenInput()
        ) : (
          <span> {i18n.t("table:editor.rename_table")} </span>
        )}
      </a>
    );
  };
}

NameEditor.propTypes = {
  table: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired
};

export default NameEditor;
