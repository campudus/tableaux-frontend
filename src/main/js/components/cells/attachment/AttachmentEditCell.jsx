import React, {Component, PropTypes} from "react";
import AttachmentOverlay from "./AttachmentOverlay.jsx";
import AttachmentLabelCell from "./AttachmentLabelCell.jsx";
import OverlayHeadRowIdentificator from "../../overlay/OverlayHeadRowIdentificator.jsx";
import ActionCreator from "../../../actions/ActionCreator";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import {isLocked} from "../../../helpers/annotationHelper";
import Header from "../../overlay/Header";
import {FallbackLanguage} from "../../../constants/TableauxConstants";

@connectToAmpersand
class AttachmentEditCell extends Component {
  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    editing: PropTypes.bool.isRequired,
    setCellKeyboardShortcuts: PropTypes.func
  };

  componentDidMount = () => {
    this.props.setCellKeyboardShortcuts({
      enter: (event) => {
        if (!isLocked(this.props.cell.row)) {
          event.stopPropagation();
          event.preventDefault();
          this.openOverlay();
        }
      }
    });
  };

  componentWillUnmount = () => {
    // Important to clean up the keyboard shortcuts
    this.props.setCellKeyboardShortcuts({});
  };

  openOverlay = () => {
    const {cell, langtag} = this.props;
    const columnName = cell.column.displayName[langtag] || cell.column.displayName[FallbackLanguage];
    ActionCreator.openOverlay({
      head: <Header title={<OverlayHeadRowIdentificator cell={cell} langtag={langtag} />} context={columnName} />,
      body: <AttachmentOverlay cell={cell} langtag={langtag} />,
      type: "normal"
    });
  };

  render() {
    const {cell, langtag} = this.props;
    const attachments = cell.value.map((element, arrayIndex) => {
      return <AttachmentLabelCell key={arrayIndex} id={element.id} attachmentElement={element}
                                  cell={cell} langtag={langtag}/>;
    });

    return (
      <div className={"cell-content"} onScroll={event => { event.stopPropagation(); }}>
        {[...attachments, <button key={"add-btn"} className="edit" onClick={this.openOverlay}><span className="fa fa-pencil"></span></button>]}
      </div>
    );
  }
}

module.exports = AttachmentEditCell;
