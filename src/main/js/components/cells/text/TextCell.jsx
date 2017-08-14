import React, {PureComponent, PropTypes} from "react";
import RichTextComponent from "../../RichTextComponent";
import ExpandButton from "./ExpandButton.jsx";
import OverlayHeadRowIdentificator from "../../overlay/OverlayHeadRowIdentificator.jsx";
import ActionCreator from "../../../actions/ActionCreator";
import f, {compose, isEmpty, isString} from "lodash/fp";
import {isLocked} from "../../../helpers/annotationHelper";
import askForSessionUnlock from "../../helperComponents/SessionUnlockDialog";
import {ColumnKinds, FallbackLanguage} from "../../../constants/TableauxConstants";
import Header from "../../overlay/Header";
import {maybe} from "../../../helpers/functools";
import {changeCell} from "../../../models/Tables";
import i18n from "i18next";

class TextCell extends PureComponent {

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
    changeCell({cell, value: valueToSave}).then(() => contentChanged(cell, langtag));
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
      .method("preventDefault");

    const {cell, langtag} = this.props;
    const table = cell.tables.get(cell.tableId);
    const context = table.displayName[langtag] || table.displayName[FallbackLanguage];

    const Wrapper = (props) => props.children;

    ActionCreator.openOverlay({
      head: <Header context={context}
                    title={<OverlayHeadRowIdentificator cell={this.props.cell} langtag={this.props.langtag} />}
      />,
      body: (
        <Wrapper>
          <div className="content-items richtext-cell-editor">
            <div className="item">
              <RichTextComponent value={textValue} langtag={langtag}
                                 saveAndClose={compose(ActionCreator.closeOverlay, this.saveCell)}
                                 hideEditorSymbols={cell.kind !== ColumnKinds.richtext}
                                 disableOnClickOutside={true}
                                 placeholder={<div className="item-description">{i18n.t("table:empty.text")}</div>}
                                 cell={this.props.cell}
              />
            </div>
          </div>
        </Wrapper>
      ),
      type: "full-height"
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

  componentWillReceiveProps = (nextProps) => {
    if (!this.props.editing && nextProps.editing) {
      this.openOverlay();
    }
  };

  handleClick = (evt) => {
    if (this.props.selected || this.props.editing) {
      this.openOverlay(evt);
    }
  };

  render() {
    const {selected} = this.props;
    const value = this.getValue();
    const isMultiLine = f.contains("\n", value);

    const expandButton = (selected)
      ? <ExpandButton onTrigger={this.openOverlay} />
      : null;

    const multiLineIndicator = (isMultiLine)
      ? <i className="fa fa-paragraph multiline-indicator" />
      : null;

    return (
      <div className={`cell-content ${(isMultiLine) ? "is-multiline" : ""}`}
           onClick={this.handleClick}
      >
        <div>{(isString(value)) ? value.split("\n")[0] : ""}</div>
        {expandButton}
        {multiLineIndicator}
      </div>
    );
  }
}

export default TextCell;
