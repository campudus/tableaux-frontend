import React, { PureComponent } from "react";
import listensToClickOutside from "react-onclickoutside";

import PropTypes from "prop-types";

import { maybe } from "../../../helpers/functools";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";

class SubfolderEdit extends PureComponent {
  handleClickOutside = () => {
    this.onSave();
  };

  getKeyboardShortcuts = () => {
    const { onCancel } = this.props;
    return {
      escape: event => {
        event.preventDefault();
        onCancel();
      },
      tab: event => {
        event.preventDefault();
        this.onSave();
      },
      enter: event => {
        event.preventDefault();
        this.onSave();
      }
    };
  };

  componentDidMount() {
    maybe(this.nameInput)
      .method("focus")
      .method("select");
  }

  onSave = () => {
    const { folder, onSave, onCancel } = this.props;
    const currentName = this.nameInput.value.toString().trim();
    const placeHolderName = folder.name;

    if (currentName === "" || currentName === placeHolderName) {
      onCancel();
    } else {
      const requestData = {
        parent: folder.parent,
        name: currentName,
        description: folder.description
      };

      onSave(folder.id, requestData);
    }
  };

  storeRef = element => {
    this.nameInput = element;
  };

  render() {
    const placeHolderName = this.props.folder.name;

    return (
      <div className="create-new-folder">
        <i className="icon fa fa-folder-open" />
        <input
          ref={this.storeRef}
          type="text"
          defaultValue={placeHolderName}
          onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(
            this.getKeyboardShortcuts
          )}
        />
      </div>
    );
  }
}

SubfolderEdit.propTypes = {
  folder: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default listensToClickOutside(SubfolderEdit);
