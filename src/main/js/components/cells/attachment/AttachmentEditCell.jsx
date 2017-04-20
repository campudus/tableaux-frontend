import React, {Component, PropTypes} from "react";
import * as _ from "lodash";
import AttachmentOverlay from "./AttachmentOverlay.jsx";
import AttachmentLabelCell from "./AttachmentLabelCell.jsx";
import OverlayHeadRowIdentificator from "../../overlay/OverlayHeadRowIdentificator.jsx";
import ActionCreator from "../../../actions/ActionCreator";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import {isLocked} from "../../../helpers/annotationHelper";

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

  removeAttachment = (file) => {
    const {cell} = this.props;

    return () => {
      let attachments = _.clone(cell.value);
      _.remove(attachments, (attachment) => file.uuid === attachment.uuid);
      ActionCreator.changeCell(cell, attachments);
    };
  };

  openOverlay = () => {
    const {cell, langtag} = this.props;
    ActionCreator.openOverlay({
      head: <OverlayHeadRowIdentificator cell={cell} langtag={langtag} />,
      body: <AttachmentOverlay cell={cell} langtag={langtag} />,
      type: "normal"
    });
  };

  render() {
    const {cell, langtag} = this.props;
    const attachments = cell.value.map((element, arrayIndex) => {
      return <AttachmentLabelCell key={arrayIndex} id={element.id} deletable={true} attachmentElement={element}
                                  cell={cell} langtag={langtag}
                                  onDelete={this.removeAttachment(element)}/>;
    });

    return (
      <div className={"cell-content"} onScroll={event => { event.stopPropagation(); }}>
        {[...attachments, <button key={"add-btn"} className="add" onClick={this.openOverlay}>+</button>]}
      </div>
    );
  }

}

module.exports = AttachmentEditCell;
