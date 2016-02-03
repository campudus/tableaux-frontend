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

  render : function () {
    return (
      <div className='cell-content'>
        {this.props.cell.rowConcatString(this.props.langtag)}
      </div>
    );
  }

});

module.exports = IdentifierCell;
