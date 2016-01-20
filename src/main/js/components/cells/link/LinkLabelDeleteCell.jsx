var React = require('react');
var RowIdentifier = require('../../helper/RowIdentifier.js');

var LinkLabelCell = React.createClass({

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    linkElement : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    id : React.PropTypes.number.isRequired,
    onDelete : React.PropTypes.func.isRequired
  },

  getLinkName : function (value, langtag) {
    var linkVal = langtag ? value[langtag] : value;
    return linkVal ? linkVal : null;
  },

  removeLinkHandler : function (event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.onDelete(this.props.id);
  },

  render : function () {
    var self = this;

    var toTable = this.props.cell.tables.get(this.props.cell.column.toTable);
    var toRow = toTable.rows.get(self.props.linkElement.id);
    var rowIdValue = RowIdentifier.getRowIdentifierByRow(toRow, self.props.langtag);

    if (!rowIdValue || rowIdValue === "") {
      rowIdValue = "#NO TRANSLATION#";
    }

    return (
        <span className="link-label delete">{rowIdValue}<i onClick={self.removeLinkHandler}
                                                           className="fa fa-times"></i></span>
    );

  }

});

module.exports = LinkLabelCell;
