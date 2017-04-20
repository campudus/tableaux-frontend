import React, {Component, PropTypes} from "react";
import * as _ from "lodash";
import LinkOverlay from "./LinkOverlay.jsx";
import LinkLabelCell from "./LinkLabelCell.jsx";
import OverlayHeadRowIdentificator from "../../overlay/OverlayHeadRowIdentificator.jsx";
import ActionCreator from "../../../actions/ActionCreator";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import {isLocked} from "../../../helpers/annotationHelper";

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
    this.props.watch(props.cell.row, {events: "change:unlocked", force: true});
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
      // Important to clean up the keyboard shortcuts
    this.props.setCellKeyboardShortcuts({});
  };

  removeLink = (idx) => {
    const {cell} = this.props;
    const newValue = _.filter(cell.value, (element) => element.id !== idx);
    ActionCreator.changeCell(cell, newValue);
  };

  openOverlay = () => {
    const {cell, langtag} = this.props;
    ActionCreator.openOverlay({
      head: <OverlayHeadRowIdentificator cell={cell} langtag={langtag} />,
      body: <LinkOverlay cell={cell} langtag={langtag} />,
      type: "no-scroll"
    });
  };

  render() {
    const {cell, langtag} = this.props;
    const links = cell.value.map((element, index) => {
      return <LinkLabelCell key={element.id} deletable={!isLocked(cell.row)} linkElement={element}
                              cell={cell} langtag={langtag} onDelete={this.removeLink}
                              linkIndexAt={index}/>;
    });

    return (
        <div className={"cell-content"} onScroll={event => { event.stopPropagation(); }}>
          {[...links, <button key={"add-btn"} className="add" onClick={this.openOverlay}>+</button>]}
        </div>
    );
  }

}

export default LinkEditCell;
