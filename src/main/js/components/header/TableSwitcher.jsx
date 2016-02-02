var App = require('ampersand-app');
var React = require('react');
var ReactDOM = require('react-dom');
var ActionCreator = require('../../actions/ActionCreator.js');

var _ = require('lodash');

var TableSwitcher = React.createClass({

  propTypes : {
    tables : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    currentId : React.PropTypes.number.isRequired,
    onClickOutside : React.PropTypes.func
  },

  getInitialState : function () {
    return {
      search : ""
    };
  },

  clickedOutside : function (e) {
    e.preventDefault();
    e.stopPropagation();
    //fixes IE Bug: Invariant Violation: findDOMNode was called on an unmounted component.
    if (this.isMounted()) {
      if (!ReactDOM.findDOMNode(this).contains(e.target)) {
        this.props.onClickOutside();
      }
    }
  },

  componentWillMount : function () {
    document.addEventListener('click', this.clickedOutside);
  },

  componentWillUnmount : function () {
    document.removeEventListener('click', this.clickedOutside);
  },

  componentDidMount : function () {

  },

  handleClick : function (entry) {
    ActionCreator.switchTable(entry.id, this.props.langtag);
  },

  onSearch : function () {
    var search = this.refs.search.value;
    this.setState({
      search : search
    });
  },

  render : function () {
    var self = this;

    var tableObj = this.props.tables.map(function (entry, index) {
      return {name : entry.get('name'), id : entry.get('id'), index : index};
    });

    // Filter + Map = reduce! Awesome! http://elijahmanor.com/reducing-filter-and-map-down-to-reduce/
    var tableNameListItems = _.reduce(tableObj, function (array, entry) {
      var isCurrentTable = (entry.id === self.props.currentId);
      var className = isCurrentTable ? 'active' : 'inactive';
      var onClickHandler = isCurrentTable ? null : self.handleClick.bind(self, entry);
      var trimmedSearchVal = self.state.search.trim().toLowerCase();
      var trimmedTableName = entry.name.trim().toLowerCase();
      //return items through search
      if (trimmedSearchVal === "" || trimmedTableName.indexOf(trimmedSearchVal) !== -1) {
        array.push(<li key={entry.id} onClick={onClickHandler} className={className}>{entry.name}</li>);
      }
      return array;
    }, []);

    return (
      <div id="table-list-wrapper">
        <div className="search-input-wrapper">
          <input autoFocus type="text" className="search-input" placeholder="Search Table..."
                 onChange={this.onSearch} defaultValue={this.state.search} ref="search"/>
          <i className="fa fa-search"></i>
        </div>
        <div id="table-list">
          <ul>
            {(tableNameListItems.length > 0) ? tableNameListItems : <li className="empty">No Tables with that name</li>}
          </ul>
        </div>
      </div>
    );
  }
});

module.exports = TableSwitcher;
