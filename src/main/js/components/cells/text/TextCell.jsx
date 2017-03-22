import React, {Component, PropTypes} from "react";
import TextEditCell from "./TextEditCell.jsx";
import TextArea from "./TextArea.jsx";
import ExpandButton from "./ExpandButton.jsx";
import TextOverlayFooter from "./TextOverlayFooter.jsx";
import OverlayHeadRowIdentificator from "../../overlay/OverlayHeadRowIdentificator.jsx";
import ActionCreator from "../../../actions/ActionCreator";
import {isEmpty} from "lodash/fp";

class TextCell extends Component {

  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    editing: PropTypes.bool.isRequired,
    selected: PropTypes.bool.isRequired
  };

  saveCell = (newValue) => {
    const oldValue = this.getValue();
    if ((isEmpty(newValue) && isEmpty(oldValue)) || newValue === oldValue) {
      return;
    }
    const {cell, langtag, contentChanged} = this.props;
    const valueToSave = (cell.isMultiLanguage)
    ? {[langtag]: newValue}
    : newValue;
    cell.save({value: valueToSave}, {success: contentChanged});
    ActionCreator.toggleCellEditing(false);
  };

  openOverlay = (event, withContent) => {
    const textValue = withContent || this.getValue();
    event.stopPropagation();
    event.preventDefault();

    ActionCreator.openOverlay({
      head: <OverlayHeadRowIdentificator cell={this.props.cell} langtag={this.props.langtag} />,
      body: <TextArea initialContent={textValue} onClose={this.closeOverlay} onSave={this.saveOverlay} />,
      footer: <TextOverlayFooter />,
      type: "normal",
      closeOnBackgroundClicked: false
    });
  };

  closeOverlay = (event) => {
    ActionCreator.closeOverlay(event);
  };

  saveOverlay = (content, event) => {
    this.closeOverlay(event);
    this.saveCell(content);
    ActionCreator.toggleCellEditing(false);
  };

  getValue = () => {
    const {cell, langtag} = this.props;
    const value = (cell.isMultiLanguage)
    ? cell.value[langtag]
      : cell.value;
    return value || "";
  };

  renderTextCell = (cell, value) => {

    const expandButton = (this.props.selected)
      ? <ExpandButton onTrigger={this.openOverlay} />
      : null;

    return (
      <div className='cell-content' onClick={this.handleClick}>
        {value}
        {expandButton}
      </div>
    );
  };

  render() {
    const {cell, langtag, editing} = this.props;
    if (!editing) {
      return this.renderTextCell(cell, this.getValue());
    } else {
      return <TextEditCell cell={cell} defaultText={this.getValue()} langtag={langtag}
                           onBlur={this.saveCell}
                           openOverlay={this.openOverlay} closeOverlay={this.closeOverlay}
                           saveOverlay={this.saveOverlay} />;
    }
  }
}

export default TextCell;
