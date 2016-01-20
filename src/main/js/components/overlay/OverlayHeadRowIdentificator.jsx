var React = require('react');
var RowIdentifier = require('../helper/RowIdentifier');

var OverlayHeadRowIdentificator = React.createClass({

  mixins : [RowIdentifier],

  propTypes : {
    cell : React.PropTypes.object,
    langtag : React.PropTypes.string
  },

  rowIdentifierString : "",

  componentWillMount : function () {
    this.rowIdentifierString = RowIdentifier.getRowIdentifierByOtherCell(this.props.cell, this.props.langtag);
    console.log("rowIdentifierString:", this.rowIdentifierString);
  },

  render : function () {

    var rowIdentification = null;
    if (this.rowIdentifierString !== "") {
      rowIdentification = <span className="row-identification-value">: {this.rowIdentifierString}</span>;
    }

    if (this.props.cell != null) {
      return (
        <span>
            <span className="column-name">{this.props.cell.column.name}{rowIdentification}</span>
          </span>
      );
    } else {
      return null;
    }
  }

});

module.exports = OverlayHeadRowIdentificator;
