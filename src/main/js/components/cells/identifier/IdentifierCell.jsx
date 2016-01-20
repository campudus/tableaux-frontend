var React = require('react');
var RowIdentifier = require('../../helper/RowIdentifier');
var AmpersandMixin = require('ampersand-react-mixin');

/**
 * TODO: Watch for changes of identification columns to update the text!
 */

var IdentifierCell = React.createClass({

  mixins : [AmpersandMixin],

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    cell : React.PropTypes.object.isRequired,
    editing : React.PropTypes.bool.isRequired,
    selected : React.PropTypes.bool.isRequired
  },

  cellClicked : function () {
    console.log("clicked ID Column cell:", this.props.cell);
    console.log("final concatCellValue:", RowIdentifier.getRowIdentifierByCell(this.props.cell, this.props.langtag));
    console.log("column: ", this.props.cell.column.concats);
  },

  render : function () {
    return (
      <div className='cell-content' onClick={this.cellClicked}>
        {RowIdentifier.getRowIdentifierByCell(this.props.cell, this.props.langtag)}
      </div>
    );
  }

});

module.exports = IdentifierCell;
