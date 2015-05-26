var React = require('react');
var Dispatcher = require('../Dispatcher');

var TableSwitcher = React.createClass({
  handleClick : function (entry) {
    return function () {
      console.log('handling click', entry);
      Dispatcher.trigger('switch-table', entry);
    }
  },

  render : function () {
    var self = this;
    var entries = this.props.tables.map(function (entry, index) {
      return {name : entry.get('name'), index : index};
    });

    return (
      <ul>
        {entries.map(function (entry) {
          return (
            <li
              key={entry.index}
              onClick={self.handleClick(entry)}
              className={entry.index === self.props.currentIndex ? 'active' : 'inactive'}>{entry.name}</li>
          );
        })}
      </ul>
    );
  }
});

module.exports = TableSwitcher;
