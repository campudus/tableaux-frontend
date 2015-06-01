var React = require('react');
var _ = require('lodash');
var OutsideClick = require('react-onclickoutside');
var Tables = require('../models/Tables');
var Dispatcher = require('../Dispatcher');

var Cell = React.createClass({

  mixins : [OutsideClick],

  getInitialState : function () {
    return {isAdding : false, tables : new Tables(), searchResults : []};
  },

  addLink : function () {
    console.log('adding link...');
    this.setState({isAdding : true});
  },

  addLinkValue : function (res) {
    var cell = this.props.cell;
    var link = {
      id : res.rowId,
      value : res.value
    };

    return function () {
      console.log('adding value to ', cell.value, link);
      var links = _.clone(cell.value);
      links.push(link);
      Dispatcher.trigger(cell.changeCellEvent, {newValue : links});
    };
  },

  handleClickOutside : function (evt) {
    this.setState({isAdding : false});
  },

  searchLink : function (e) {
    var self = this;
    var inputValue = this.refs.searchLink.getDOMNode().value;

    var link = this.props.cell.column;

    this.state.tables.getOrFetch(link.toTable, function (err, table) {
      if (err) {
        console.log('error getting table', link.toTable, err);
        return;
      }
      table.columns.fetch({
        success : function () {
          table.rows.fetch({
            success : function () {
              var searchAtIndex = -1;
              table.columns.find(function (column, idx) {
                var p = column.id === link.toColumn;
                if (p) {
                  searchAtIndex = idx;
                }
                return p;
              });
              var filteredRows = table.rows.map(function (row) {
                return row.cells[searchAtIndex];
              }).filter(function (cell) {
                return cell.value.indexOf(inputValue) > -1;
              });

              console.log('searchResults=', filteredRows);
              self.setState({searchResults : filteredRows});
            },
            error : function (err) {
              console.log('error getting rows', err)
            }
          });
        },
        error : function (err) {
          console.log('error getting columns', err)
        }
      });
    });

    if (e.keyCode == 13) {
      this.setState({isAdding : false});
      console.log('parent, parent, parent', this.props.cell, inputValue);
    }
  },

  render : function () {
    var self = this;
    var adder = '';

    if (!this.state.isAdding) {
      adder = <span className="add" onClick={self.addLink}>+</span>;
    } else {
      adder = (
        <div className="add">
          <input type="text" ref="searchLink" onKeyUp={self.searchLink}/>
          <ul>
            {this.state.searchResults.map(function (res) {
              return <li key={res.rowId} onClick={self.addLinkValue.call(self, res)}>{res.value}</li>;
            })}
          </ul>
        </div>
      );
    }

    return <div className="searchlink">{adder}</div>
  }

});

module.exports = Cell;
