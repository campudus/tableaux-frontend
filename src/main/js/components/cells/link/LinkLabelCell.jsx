import React, {Component, PropTypes} from "react";
import {loadAndOpenEntityView} from "../../overlay/EntityViewOverlay";

export default class LinkLabelCell extends Component {

  static propTypes = {
    cell: PropTypes.object.isRequired,
    linkElement: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,

    // Used for performance reason to get cached derived value from the cell model
    linkIndexAt: PropTypes.number.isRequired,

    // clickable label (optional)
    clickable: PropTypes.bool
  };

  getLinkName = () => {
    const {cell, langtag, linkIndexAt} = this.props;
    return cell.linkString(linkIndexAt, langtag);
  };

  render() {
    const {langtag, cell, clickable} = this.props;
    const tableId = cell.column.toTable;
    const rowId = this.props.linkElement.id;

    const clickFn = evt => {
      loadAndOpenEntityView({tables: cell.tables, tableId, rowId}, langtag);
      evt.stopPropagation();
    };

    return <a href="#" onClick={(clickable) ? clickFn : () => {}} className="link-label">
      <div className="label-text">{this.getLinkName()}</div>
    </a>;
  }
}

module.exports = LinkLabelCell;
