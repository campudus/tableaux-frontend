var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var IdentifierCell = React.createClass({

  mixins : [AmpersandMixin],

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    cell : React.PropTypes.object.isRequired,
    editing : React.PropTypes.bool.isRequired,
    selected : React.PropTypes.bool.isRequired
  },

  cellClicked : function () {
    //console.log("clicked ID Column cell:", this.props.cell);
  },

  render : function () {
    //console.log("IdentifierCell is rendering.");
    return (
      <div className='cell-content' onClick={this.cellClicked}>
        {this.props.cell.rowConcatString(this.props.langtag)}
      </div>
    );
  }

});

module.exports = IdentifierCell;
