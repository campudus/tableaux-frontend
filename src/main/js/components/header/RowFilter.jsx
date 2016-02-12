var React = require('react');
var ActionCreator = require('../../actions/ActionCreator');

var RowFilter = React.createClass({

  propTypes : {},

  filterChange : function (event) {
  },

  filterUpdate : function (event) {
    ActionCreator.changeFilter(this.refs.filterInput.value);
  },

  render : function () {
    return (
      <span id="filter-wrapper">
        <input type="text" className="filter-input" ref="filterInput" onChange={this.filterChange}/>
        <button onClick={this.filterUpdate}>Filter anwenden</button>
      </span>
    )
  }

});

module.exports = RowFilter;