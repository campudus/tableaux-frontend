var React = require('react');

var TableSwitcher = React.createClass({
  handleClick : function (entry) {
    var self = this;
    return function () {
      console.log('handling click', entry);
      self.props.tables.trigger('switch-table', entry);
      console.log('triggered event on', self.props.tables);
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
