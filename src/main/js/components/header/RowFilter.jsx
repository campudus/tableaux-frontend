var React = require('react');
var ActionCreator = require('../../actions/ActionCreator');
var KeyboardShortcutsMixin = require('../mixins/KeyboardShortcutsMixin');

var RowFilter = React.createClass({

  mixins : [KeyboardShortcutsMixin],
  propTypes : {},

  filterChange : function (event) {

  },

  filterUpdate : function (event) {
    ActionCreator.changeFilter(this.refs.filterInput.value);
  },

  getKeyboardShortcuts : function (event) {
    var self = this;
    return {
      enter : function (event) {
        self.filterUpdate(event);
      }
    };
  },

  render : function () {
    return (
      <span id="filter-wrapper">
        <input type="text" className="filter-input" ref="filterInput" onChange={this.filterChange}
               onKeyDown={this.onKeyboardShortcut}/>
        <button onClick={this.filterUpdate}>Filter anwenden</button>
      </span>
    )
  }

});

module.exports = RowFilter;