import React, {PureComponent, PropTypes} from "react";
import {openLinkOverlay} from "./LinkOverlay.jsx";
import LinkLabelCell from "./LinkLabelCell.jsx";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import {isLocked} from "../../../helpers/annotationHelper";
import {isUserAdmin} from "../../../helpers/accessManagementHelper";

@connectToAmpersand
class LinkEditCell extends PureComponent {
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
        <LinkLabelCell key={element.id} clickable={false} linkElement={element}
                       cell={cell} langtag={langtag}
                       linkIndexAt={index}
        />
      )
    );

    return (
      <div className={"cell-content"} onScroll={event => { event.stopPropagation(); }}
           onClick={this.openOverlay}
      >
        {[...links, <button key={"add-btn"} className="edit"><span className="fa fa-pencil"></span></button>]}
      </div>
    );
  }

}

export default LinkEditCell;
