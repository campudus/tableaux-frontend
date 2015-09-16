var React = require('react');
var Dispatcher = require('../Dispatcher');
var AmpersandMixin = require('ampersand-react-mixin');
var _ = require('lodash');

var LinkOverlay = React.createClass({
  mixins : [AmpersandMixin],

  getInitialState : function () {
    return {tableId : null, columnName : "", search : "", open : false, rowResults : {}};
  },

  componentWillMount : function () {
    Dispatcher.on('openLinkOverlay', this.openOverlay);
  },

  componentWillUnmount : function () {
    Dispatcher.off('openLinkOverlay', this.openOverlay);
  },

  onSearch : function (event) {
    console.log("LinkOverlay.onSearch");

    var search = this.refs.search.getDOMNode().value;

    this.setState({
      search : search
    });
  },

  addLinkValue : function (isLinked, row) {
    var cell = this.cell;
    var link = {
      id : row.id,
      // TODO id != position
      value : row.values[this.toColumn.id - 1]
    };

    return function () {
      var links = _.clone(cell.value);

      if (isLinked) {
        _.remove(links, function (linked) {
          return row.id === linked.id;
        });
      } else {
        links.push(link);
      }

      console.log("trigger", cell.changeCellEvent);
      Dispatcher.trigger(cell.changeCellEvent, {newValue : links});
    };
  },

  openOverlay : function (cell) {
    var self = this;

    if (cell.column.kind !== "link") {
      console.error("Couldn't open LinkOverlay for this column type.");
      return;
    }

    this.toColumn = cell.column.toColumn;
    this.cell = cell;

    // listen for changes on this model
    this.watch(this.cell, {reRender : false});

    var toTable = cell.column.toTable;

    cell.fetch({
      success : function (model, response, options) {
        cell.tables.getOrFetch(toTable, function (err, table) {

          var tableName = table.name;
          self.setState({tableId : toTable, columnName : tableName, open : true});

          if (err) {
            console.error('error getting table in overlay', err);
            return;
          }

          table.columns.fetch({
            success : function () {
              table.rows.fetch({
                success : function () {
                  self.setState({rowResults : table.rows});
                },
                error : function (err) {
                  console.error('error fetching rows', err);
                }
              });
            },
            error : function (err) {
              console.error("error fetching columns", err);
            }
          });
        });
      },
      error : function (err) {
        console.error("error fetching cell", err);
      }
    });
  },

  closeOverlay : function () {
    this.stopListening();
    this.setState(this.getInitialState());
  },

  renderOverlay : function () {
    var self = this;

    var openClosedClassName = this.state.open ? "open" : "closed";

    var listItems = null;

    //check for empty obj or map fails
    if (this.state.open && !_.isEmpty(this.state.rowResults)) {
      listItems = (
        <ul>
          {this.state.rowResults.map(function (row) {

            var currentCellValue = self.cell.value;

            var linked = _.find(currentCellValue, function (link) {
              return link.id === row.id;
            });

            var isLinked = linked ? true : false;

            // TODO id != position
            var value = row.values[self.toColumn.id - 1];

            if (self.toColumn.multilanguage) {
              value = value[self.props.language] || null;
            }

            if (value !== null && self.state.search !== null && value.toLowerCase().indexOf(self.state.search.trim().toLocaleLowerCase()) === -1) {
              return "";
            }

            return <li key={row.id} className={isLinked ? 'isLinked' : ''}
                       onClick={self.addLinkValue(isLinked, row)}>{value}</li>;
          })}
        </ul>
      );
    }

    return (
      <div id="overlay" className={openClosedClassName} ref="overlay">
        <div id="overlay-wrapper">
          <h2>{this.state.columnName}</h2>

          <div className="content-scroll">
            <div id="overlay-content">
              <div className="search-input-wrapper">
                <input type="text" className="search-input" placeholder="Search..." onChange={this.onSearch}
                       ref="search"/>
                <i className="fa fa-search"></i>
              </div>
              {listItems}
            </div>
          </div>
        </div>
        <div onClick={this.closeOverlay} className="background"></div>
      </div>
    );
  },

  render : function () {
    /*
     Todo: Remove overlay content when animation has finished, so no flashing appears.
     For now, the last overlay content stays in the DOM.
     */
    //return this.renderOverlay(<h2>You clicked {this.state.columnName} with id TableId {this.state.tableId}</h2>);
    return this.renderOverlay();
  }

});

module.exports = LinkOverlay;
