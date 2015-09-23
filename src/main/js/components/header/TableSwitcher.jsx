var app = require('ampersand-app');
var React = require('react');

var TableSwitcher = React.createClass({
  handleClick : function (entry) {
    return function () {
      console.log('TableSwitcher.handleClick', entry);
      app.router.history.navigate('table/' + entry.id, {trigger : true});
    }
  },

  render : function () {
    var self = this;
    var entries = this.props.tables.map(function (entry, index) {
      return {name : entry.get('name'), id : entry.get('id'), index : index};
    });

    return (
      <nav id="table-switcher">
      <ul className="table-switcher-menu">
        {entries.map(function (entry) {
          return (
            <li
              key={entry.id}
              onClick={self.handleClick(entry)}
              className={entry.id === self.props.currentId ? 'active' : 'inactive'}>{entry.name}</li>
          );
        })}
      </ul>
      </nav>
    );
  }
});

module.exports = TableSwitcher;
