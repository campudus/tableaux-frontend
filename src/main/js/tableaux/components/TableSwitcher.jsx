var app = require('ampersand-app');
var React = require('react');
var Dispatcher = require('../Dispatcher');

var TableSwitcher = React.createClass({
  handleClick : function (entry) {
    return function () {
      console.log('handling click', entry);
      Dispatcher.trigger('switch-table', entry);

      app.router.history.navigate('table/' + entry.id, {trigger : false})
    }
  },

  render : function () {
    var self = this;
    var entries = this.props.tables.map(function (entry, index) {
      return {name : entry.get('name'), id : entry.get('id'), index : index};
    });

    return (
      <ul>
        {entries.map(function (entry) {
          return (
            <li
              key={entry.id}
              onClick={self.handleClick(entry)}
              className={entry.id === self.props.currentId ? 'active' : 'inactive'}>{entry.name}</li>
          );
        })}
      </ul>
    );
  }
});

module.exports = TableSwitcher;
