const React = require('react');
let RowConcatHelper = require('../../../helpers/RowConcatHelper.js');

export const LinkLabelCell = React.createClass({

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    linkElement : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,

    //Used for performance reason to get cached derived value from the cell model
    linkIndexAt : React.PropTypes.number.isRequired,

    //optional for delete label
    deletable : React.PropTypes.bool.isRequired,
    onDelete : React.PropTypes.func
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

  render : function () {
    const {langtag, cell, deletable} = this.props;

    if (deletable) {
      const tableId = cell.column.toTable;
      const rowId = this.props.linkElement.id;

      const linkToTable = `/${langtag}/tables/${tableId}`;

      const deleteButton = <i onClick={this.removeLinkHandler} className="fa fa-times"></i>;

      return <a href={[linkToTable, `rows/${rowId}?filter`].join("/")} target="_blank" className="link-label delete">
        {this.getLinkName()}{deleteButton}
      </a>;
    } else {
      return <span className="link-label">
        {this.getLinkName()}
      </span>;
    }
  }
});

module.exports = LinkLabelCell;
