var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var Row = require('./Row.jsx');

var Rows = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'Rows',

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    rows : React.PropTypes.object.isRequired,
    selectedCell : React.PropTypes.object,
    selectedCellEditing : React.PropTypes.bool
  },

  componentDidMount : function () {
    console.log("Rows did mount");
  },

  render : function () {
    var self = this;
    var rows = this.props.rows.map(function (row, idx) {
      return <Row key={idx} row={row} selectedCell={self.props.selectedCell}
                  selectedCellEditing={self.props.selectedCellEditing} langtag={self.props.langtag}/>
    });

    return <div className="data">{rows}</div>;
  }
});

module.exports = Rows;
