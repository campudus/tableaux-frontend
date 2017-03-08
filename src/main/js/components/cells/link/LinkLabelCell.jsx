import React, {Component, PropTypes} from "react";

export default class LinkLabelCell extends Component {

  static propTypes = {
    cell: PropTypes.object.isRequired,
    linkElement: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,

    // Used for performance reason to get cached derived value from the cell model
    linkIndexAt: PropTypes.number.isRequired,

    // clickable label with delete button (optional)
    deletable: PropTypes.bool.isRequired,
    onDelete: PropTypes.func,

    // clickable label (optional)
    clickable: PropTypes.bool
  };

  getLinkName = () => {
    const {cell, langtag, linkIndexAt} = this.props;
    return cell.linkString(linkIndexAt, langtag);
  };

  removeLinkHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    this.props.onDelete(this.props.linkElement.id);
  };

  renderDeletable = () => {
    const {langtag, cell, onDelete} = this.props;

    if (!onDelete) {
      throw new Error("onDelete property required is deletable");
    }

    const tableId = cell.column.toTable;
    const rowId = this.props.linkElement.id;

    const href = `/${langtag}/tables/${tableId}/rows/${rowId}?filter&overlay`;

    return <a href={href} target="_blank" className="link-label delete">
      {this.getLinkName()}
      <i onClick={this.removeLinkHandler} className="fa fa-times"></i>
    </a>;
  };

  renderClickable = () => {
    const {langtag, cell} = this.props;

    const tableId = cell.column.toTable;
    const rowId = this.props.linkElement.id;

    const href = `/${langtag}/tables/${tableId}/rows/${rowId}?filter&overlay`;

    return <a href={href} target="_blank" className="link-label delete">
      {this.getLinkName()}
    </a>;
  };

  renderLabel = () => {
    return <span className="link-label">
        {this.getLinkName()}
      </span>;
  };

  render() {
    const {clickable, deletable} = this.props;

    if (deletable) {
      return this.renderDeletable();
    } else if (clickable) {
      return this.renderClickable();
    } else {
      return this.renderLabel();
    }
  }
};

module.exports = LinkLabelCell;
