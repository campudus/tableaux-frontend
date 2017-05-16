import React from "react";
import RichTextComponent from "../../RichTextComponent";
import {changeCell} from "../../../models/Tables.js";
import {isLocked} from "../../../helpers/annotationHelper";

class TextView extends React.Component {

  constructor(props) {
    super(props);
    this.displayName = "TextView";
    this.prevSelection = null;
    this.state = {editing: false};
  }

  static propTypes = {
    langtag: React.PropTypes.string.isRequired,
    cell: React.PropTypes.object.isRequired,
    funcs: React.PropTypes.object.isRequired
  };

  getValue = () => {
    const cell = this.props.cell;
    const value = (cell.isMultiLanguage)
      ? cell.value[this.props.langtag]
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
    const changes = (cell.isMultiLanguage)
      ? {[langtag]: newValue}
      : newValue;
    changeCell({
      cell,
      value: changes
    });
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
    const {langtag, funcs, cell} = this.props;
    const isRowLocked = isLocked(cell.row);

    return <div onKeyDown={(this.editing) ? function () {
    } : this.editOnEnter}
                onClick={e => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                tabIndex={1}
                ref={el => { funcs.register(el); }}
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
