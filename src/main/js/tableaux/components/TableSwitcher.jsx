var React = require('react');

var TableSwitcher = React.createClass({
  handleClick : function (entry) {
    return function () {
      console.log('handling click', entry);
      //dispatcher.emit(TableauxConstants.CHANGE_TABLE, entry);
    }
  },

  render : function () {
    var self = this;
    return (
      <ul>
        {this.props.entries.map(function (entry) {
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
