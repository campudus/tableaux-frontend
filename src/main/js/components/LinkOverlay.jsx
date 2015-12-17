var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var _ = require('lodash');
var RowName = require('./RowName.jsx');
var Dispatcher = require('../dispatcher/Dispatcher');

var LinkOverlay = React.createClass({
  mixins : [AmpersandMixin],

  getInitialState : function () {
    return {tableId : null, columnName : "", search : "", open : false, rowResults : {}, cell : null};
  },

  componentWillMount : function () {
    Dispatcher.on('openLinkOverlay', this.openOverlay);
  },

  componentWillUnmount : function () {
    Dispatcher.off('openLinkOverlay', this.openOverlay);
  },

  onSearch : function (event) {
    console.log("LinkOverlay.onSearch");

    var search = this.refs.search.value;

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
    self.setState({cell : cell});

    console.log("overlay starting: ", cell);

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

          if (err) {
            console.error('error getting table in overlay', err);
            return;
          }

          var tableName = table.name;
          self.setState({tableId : toTable, columnName : tableName, open : true});

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
    var listItems = null;

    //check for empty obj or map fails
    if (!_.isEmpty(this.state.rowResults)) {
      // TODO works but isn't nice
      document.getElementsByTagName("body")[0].style.overflow = "hidden";

      listItems = (
          <ul>
            {this.state.rowResults.map(function (row) {

                var currentCellValue = self.cell.value;

                var linked = _.find(currentCellValue, function (link) {
                    return link.id === row.id;
                    });

                var isLinked = linked ? true : false;

                // TODO column id != value position in array
                var value = row.values[self.toColumn.id - 1];

                if (self.toColumn.multilanguage) {
                    value = value[self.props.language] || null;
                    }

                if (value !== null && self.state.search !== null && value.toLowerCase().indexOf(self.state.search.trim().toLocaleLowerCase()) === -1) {
                    // TODO kinda hack
                    return "";
                    }

                return <li key={row.id} className={isLinked ? 'isLinked' : ''}
                           onClick={self.addLinkValue(isLinked, row)}>{value}</li>;
                })}
          </ul>
      );
    }

    return (
        <div id="overlay" className="open">
          <div id="overlay-wrapper">
            <h2>{this.state.columnName} <RowName cell={this.state.cell} langtag={this.props.language}/>
            </h2>

            <div className="content-scroll">
              <div id="overlay-content">
                <div className="search-input-wrapper">
                  <input type="text" className="search-input" placeholder="Search..." onChange={this.onSearch}
                         defaultValue={this.state.search} ref="search"/>
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
    if (!this.state.open) {
      document.getElementsByTagName("body")[0].style.overflow = "auto";
      return <div id="overlay" className="closed"/>;
    }

    // TODO works but isn't nice
    document.getElementsByTagName("body")[0].style.overflow = "hidden";

    return this.renderOverlay();
  }

});

module.exports = LinkOverlay;
