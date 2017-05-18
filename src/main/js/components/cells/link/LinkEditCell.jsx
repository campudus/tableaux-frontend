import React, {Component, PropTypes} from "react";
import {openLinkOverlay} from "./LinkOverlay.jsx";
import LinkLabelCell from "./LinkLabelCell.jsx";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import {isLocked} from "../../../helpers/annotationHelper";
import {isUserAdmin} from "../../../helpers/accessManagementHelper";

@connectToAmpersand
class LinkEditCell extends Component {
  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    editing: PropTypes.bool.isRequired,
    setCellKeyboardShortcuts: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.props.watch(props.cell.row,
      {
        events: "change:unlocked",
        force: true
      });
  }

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
    this.props.setCellKeyboardShortcuts({});
  };

  openOverlay = () => {
    const {cell, langtag} = this.props;
    if (isUserAdmin() && !isLocked(cell.row)) {
      openLinkOverlay(cell, langtag);
    }
  };

  render() {
    const {cell, langtag} = this.props;
    const links = cell.value.map(
      (element, index) => (
        <LinkLabelCell key={element.id} clickable={true} linkElement={element}
                       cell={cell} langtag={langtag}
                       linkIndexAt={index}
        />
      )
    );

    return (
      <div className={"cell-content"} onScroll={event => {
        event.stopPropagation();
      }}>
        {[...links, <button key={"add-btn"} className="add" onClick={this.openOverlay}>+</button>]}
      </div>
    );
  }

}

export default LinkEditCell;
