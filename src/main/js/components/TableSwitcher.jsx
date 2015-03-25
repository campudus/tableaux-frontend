var React = require('react');
var PureRenderMixin = require('react/addons').addons.PureRenderMixin;

var TableSwitcher = React.createClass({
  mixins : [PureRenderMixin],

  propTypes : {
    switchFn : React.PropTypes.func.isRequired,
    tables : React.PropTypes.arrayOf({
      id : React.PropTypes.number.isRequired,
      name : React.PropTypes.string.isRequired
    })
  },

  switchTable : function (id) {
    var switchFn = this.props.switchFn;
    return function () {
      console.log('clicked on ' + id);
      switchFn(id);
    }
  },

  render : function () {
    console.log('rendering TableSwitcher');
    var switchFn = this.switchTable;
    var tables = this.props.tables;

    return (
      <ul>
      {tables.map(function (t) {
        return (
          <li onClick={switchFn(t.id)}>{t.name}</li>
        );
      })}
      </ul>
    );
  }
});

module.exports = TableSwitcher;
