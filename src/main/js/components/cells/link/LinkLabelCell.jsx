var React = require('react');
var RowIdentifier = require('../../helper/RowIdentifier.js');

/**
 * FIXME: This can't go into production. Backend needs proper link values! Just for dev purpose
 */
var LinkLabelCell = React.createClass({

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    linkElement : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired
  },

  getInitialState : function () {
    return {
      linkName : "loading..."
    }
  },

  componentWillMount : function () {
    console.log("LinkLabelCell linkElement:", this.props.linkElement);
    console.log("LinkLabelCell column:", this.props.cell.column);

    this.getRows();
  },

  getRows : function () {

    var self = this;
    var toTable = this.props.cell.tables.get(this.props.cell.column.toTable);


    toTable.columns.fetch({
      success : function () {
        toTable.rows.fetch({
          success : function () {
            var toRow = toTable.rows.get(self.props.linkElement.id);
            var rowIdValue = RowIdentifier.getRowIdentifierByRow(toRow, self.props.langtag);

            if (!rowIdValue || rowIdValue === "") {
              rowIdValue = "#NO TRANSLATION#";
            }
            self.setState({linkName : rowIdValue});
          },
          error : function (err) {
            console.error('error fetching rows', err);
          }
        });
      },
      error : function (err) {
        console.error("error fetching columns", err);
      }
    });
  },

  render : function () {
    return (
        <span className="link-label">{this.state.linkName}</span>
    );

  }

});

module.exports = LinkLabelCell;
