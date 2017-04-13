import React, {Component, PropTypes} from "react";
import RichTextComponent from "../../RichTextComponent";
import ExpandButton from "./ExpandButton.jsx";
import OverlayHeadRowIdentificator from "../../overlay/OverlayHeadRowIdentificator.jsx";
import ActionCreator from "../../../actions/ActionCreator";
import {compose, isEmpty} from "lodash/fp";
import {isLocked} from "../../../helpers/annotationHelper";
import askForSessionUnlock from "../../helperComponents/SessionUnlockDialog";
import {FallbackLanguage} from "../../../constants/TableauxConstants";
import Header from "../../overlay/Header";
import i18n from "i18next";
import {maybe, fspy} from "../../../helpers/monads";

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
      ActionCreator.toggleCellEditing({editing: false});
      return;
    }
    const {cell, langtag, contentChanged} = this.props;
    const valueToSave = (cell.isMultiLanguage)
    ? {[langtag]: newValue}
    : newValue;
    cell.save({value: valueToSave}, {patch: true, success: contentChanged});
    ActionCreator.toggleCellEditing({editing: false});
  };

  openOverlay = (event, withContent) => {
    if (isLocked(this.props.cell.row)) {
      askForSessionUnlock(this.props.cell.row);
      return;
    }
    const textValue = withContent || this.getValue();
    maybe(event)
      .method("stopPropagation")
      .method("preventDefault")

    const {cell, langtag} = this.props;
    const table = cell.tables.get(cell.tableId);
    const context = table.displayName[langtag] || table.displayName[FallbackLanguage];

    ActionCreator.openOverlay({
      head: <Header context={context}
                    title={<OverlayHeadRowIdentificator cell={this.props.cell} langtag={this.props.langtag} />}
                    actions={{positive: [i18n.t("common:save"), this.saveCell]}}
      />,
      body: (
        <div className="content-items">
          <div className="item">
            <RichTextComponent value={textValue} langtag={langtag} saveAndClose={compose(ActionCreator.closeOverlay, this.saveCell)}/>
          </div>
        </div>
      ),
      type: "full-height",
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

  componentWillReceiveProps = (nextProps, nextState) => {
    console.log("nextProps", nextProps)

    if (!this.props.editing && nextProps.editing) {
      this.openOverlay();
    }
  };

  render() {
    const {selected} = this.props;

    const expandButton = (selected)
      ? <ExpandButton onTrigger={this.openOverlay} />
      : null;

    return (
      <div className='cell-content' onClick={this.handleClick}>
        {this.getValue().split("\n")[0]}
        {expandButton}
      </div>
    );
  }
}

export default TextCell;
