var App = require('ampersand-app');
var React = require('react');

var TableSwitcher = React.createClass({

  propTypes : {
    tables : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    currentId : React.PropTypes.number.isRequired
  },

  handleClick : function (entry) {
    var langtag = this.props.langtag;

    return function () {
      console.log('TableSwitcher.handleClick', entry);
      App.router.history.navigate(langtag + '/table/' + entry.id, {trigger : true});
    }
  },

  render : function () {
    var self = this;

    var entries = this.props.tables.map(function (entry, index) {
      return {name : entry.get('name'), id : entry.get('id'), index : index};
    }).map(function (entry) {
      var className = entry.id === self.props.currentId ? 'active' : 'inactive';

      return <li key={entry.id} onClick={self.handleClick(entry)} className={className}>{entry.name}</li>;
    });

    return (
      <nav id="table-switcher">
        <ul className="table-switcher-menu">
          {entries}
        </ul>
      </nav>
    );
  }
});

module.exports = TableSwitcher;
