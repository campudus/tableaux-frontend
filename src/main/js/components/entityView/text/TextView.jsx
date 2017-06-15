import React, {Component, PropTypes} from "react";
import RichTextComponent from "../../RichTextComponent";
import {changeCell} from "../../../models/Tables.js";
import {isLocked} from "../../../helpers/annotationHelper";
import {contentChanged} from "../../cells/Cell";

class TextView extends Component {

  constructor(props) {
    super(props);
    this.displayName = "TextView";
    this.prevSelection = null;
    this.state = {editing: false};
  }

  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    funcs: PropTypes.object.isRequired,
    thisUserCantEdit: PropTypes.bool
  };

  getValue = () => {
    const {cell, langtag} = this.props;
    const value = (cell.isMultiLanguage)
      ? cell.value[langtag]
      : cell.value;
    return value || "";
  };

  setEditing = editing => () => {
    this.setState({editing: editing});
    if (editing === false && this.prevSelection) {
      this.prevSelection.focus();
    }
  };

  saveAndClose = (newValue) => {
    const {cell, langtag} = this.props;
    const oldValue = this.getValue();
    const changes = (cell.isMultiLanguage)
      ? {[langtag]: newValue}
      : newValue;

    changeCell({
      cell,
      value: changes
    }).then(contentChanged(cell, langtag, oldValue));

    this.setEditing(false)();
  };

  editOnEnter = event => {
    if (event.key === "Enter") {
      event.stopPropagation();
      event.preventDefault();
      this.prevSelection = document.activeElement;
      this.setEditing(true)();
    }
  };

  render() {
    const value = this.getValue();
    const {editing} = this.state;
    const {langtag, funcs, cell, thisUserCantEdit} = this.props;
    const isRowLocked = isLocked(cell.row);

    return <div onKeyDown={(this.editing || thisUserCantEdit) ? function () {
    } : this.editOnEnter}
                tabIndex={1}
                ref={el => {
                  funcs.register(el);
                }}
    >
      {(editing)
        ? (
          <RichTextComponent value={value}
                             className="item-content text-editor"
                             close={this.setEditing(false)}
                             saveAndClose={this.saveAndClose}
                             langtag={langtag}
          />
        )
        : (
          <RichTextComponent value={value}
                             className="item-content text"
                             langtag={langtag}
                             readOnly={true}
                             onClick={(isRowLocked) ? function () {
                             } : this.setEditing(true)}
          />
        )
      }
      {this.props.children}
    </div>;
  }
}

export default TextView;
