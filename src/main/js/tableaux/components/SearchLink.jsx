var React = require('react');
var Tables = require('../models/Tables');
var _ = require('lodash');

var Cell = React.createClass({

  getInitialState : function () {
    return {isAdding : false, tables : new Tables(), searchResults : []};
  },

  addLink : function () {
    console.log('adding link...');
    this.setState({isAdding : true});
  },

  addLinkValue : function (res) {
    var self = this;
    var link = {
      id : res.rowId,
      value : res.value
    };

    return function () {
      console.log('adding value to ', self.props.cell.value, link);
      self.props.cell.value.push(link);
      self.props.cell.save({method : "PUT"});
    };
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

    if (!this.state.isAdding) {
      return <span className="add" onClick={self.addLink}>+</span>;
    } else {
      return (
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
  }

});

module.exports = Cell;
