import React, {Component, PropTypes} from "react";
import LinkLabelCell from "./LinkLabelCell.jsx";
import LinkEditCell from "./LinkEditCell.jsx";
import * as f from "lodash/fp";

class LinkCell extends Component {

  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    selected: PropTypes.bool.isRequired,
    editing: PropTypes.bool.isRequired,
    setCellKeyboardShortcuts: PropTypes.func
  };

  render() {
    const {editing, selected, cell, langtag, setCellKeyboardShortcuts} = this.props;

    if (selected) {
      return <LinkEditCell cell={cell} langtag={langtag}
                           editing={editing}
                           setCellKeyboardShortcuts={setCellKeyboardShortcuts}
      />;
    } else {
      // Show a link preview for performance
      const tooManyLinks = cell.value.length > 3;
      const links = f.take(3, cell.value)
                     .map((element, index) => {
                         return <LinkLabelCell key={element.id} linkElement={element} linkIndexAt={index} cell={cell}
                                               langtag={langtag}
                                               deletable={false}
                         />;
                       });
      return (
        <div className={"cell-content"}>
          {(tooManyLinks) ? [...links, <span key={"more"} className="more">&hellip;</span>] : links}
        </div>
      );
    }
  }

}

module.exports = LinkCell;
