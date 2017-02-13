const React = require('react');

export const LinkLabelCell = React.createClass({

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    linkElement : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,

    //Used for performance reason to get cached derived value from the cell model
    linkIndexAt : React.PropTypes.number.isRequired,

    // clickable label with delete button (optional)
    deletable : React.PropTypes.bool.isRequired,
    onDelete : React.PropTypes.func,

    // clickable label (optional)
    clickable : React.PropTypes.bool,
  },

  getLinkName : function () {
    const {cell, langtag, linkIndexAt} = this.props;
    return cell.linkString(linkIndexAt, langtag);
  },

  removeLinkHandler : function (event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.onDelete(this.props.linkElement.id);
  },

  renderDeletable : function () {
    const {langtag, cell, onDelete} = this.props;

    if (!onDelete) {
      throw new Error("onDelete property required is deletable");
    }

    const tableId = cell.column.toTable;
    const rowId = this.props.linkElement.id;

    const href = `/${langtag}/tables/${tableId}/rows/${rowId}?filter`;

    return <a href={href} target="_blank" className="link-label delete">
      {this.getLinkName()}
      <i onClick={this.removeLinkHandler} className="fa fa-times"></i>
    </a>;
  },

  renderClickable : function () {
    const {langtag, cell} = this.props;

    const tableId = cell.column.toTable;
    const rowId = this.props.linkElement.id;

    const href = `/${langtag}/tables/${tableId}/rows/${rowId}?filter`;

    return <a href={href} target="_blank" className="link-label delete">
      {this.getLinkName()}
    </a>;
  },

  renderLabel : function () {
    return <span className="link-label">
        {this.getLinkName()}
      </span>;
  },

  render : function () {
    const {clickable, deletable} = this.props;

    if (deletable) {
      return this.renderDeletable();
    } else if (clickable) {
      return this.renderClickable();
    } else {
      return this.renderLabel();
    }
  }
});

module.exports = LinkLabelCell;
