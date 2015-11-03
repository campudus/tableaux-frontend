var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var Row = require('./Row.jsx');

var Rows = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'Rows',

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    rows : React.PropTypes.object.isRequired
  },

  render : function () {
    var self = this;
    var rows = this.props.rows.map(function (row, idx) {
      return <Row key={idx} row={row} langtag={self.props.langtag}/>
    });

    return <div className="data">{rows}</div>;
  }
});

module.exports = Rows;
