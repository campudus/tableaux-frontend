var React = require('react');
var dispatcher = require('../TableauxDispatcher');
var BackboneMixin = require('backbone-react-component');
var TableauxConstants = require('../TableauxConstants');

var Cell = React.createClass({
  mixins : [BackboneMixin],

  render : function () {
    console.log('in LabelCell');
    return (
      <td className="cell" onClick={this.props.onClick}>
        {this.getModel().value}
      </td>
    );
  }
});

module.exports = Cell;
