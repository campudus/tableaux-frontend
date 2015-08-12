var React = require('react');
var Dispatcher = require('../Dispatcher');
var AmpersandMixin = require('ampersand-react-mixin');
var _ = require('lodash');

var LinkOverlay = React.createClass({
  mixins : [AmpersandMixin],
  toColumn : {},

  propTypes : {

  },

  getDefaultProps: function() {
    return {
      cell: {}
    };
  },

  getInitialState : function () {
    return {tableId : null, columnName : "", open : false, rowResults : {}};
  },

  componentWillMount : function () {
    Dispatcher.on('openOverlay', this.openOverlay);
  },

  componentWillUnmount : function () {
    Dispatcher.off('openOverlay', this.openOverlay);
  },

  closeOverlay : function () {
    this.setState({open : false});
  },

  addLinkValue : function (res) {
    var cell = this.props.cell;
    var link = {
      id : res.id,
      value : res.values[this.toColumn.id - 1]
    };
    //console.log('res: ', res);

    return function () {
      var links = _.clone(cell.value);
      links.push(link);
      console.log('adding value to ', cell.value, links);
      Dispatcher.trigger(cell.changeCellEvent, {newValue : links});
    };
  },

  openOverlay : function (cell) {

    var self = this;
    this.toColumn = cell.column.toColumn;

    //FIXME: is this bad ?
    this.props.cell = cell;
    this.watch(this.props.cell, {reRender : true});
    var toTable = cell.column.toTable;

    cell.tables.getOrFetch(cell.column.toTable, function (err, table) {
      var tableName = table.name;
      self.setState({tableId : toTable, columnName : tableName, open : true});
      if (err) {
        console.log('error getting table in overlay', toTable, err);
        return;
      }
      table.rows.fetch({
        success : function () {
          console.log("change state to rowResults: ", table.rows);
          self.setState({rowResults : table.rows});
        },
        error : function (err) {
          console.log('error fetching rows', err);
        },
        kickListener : true
      });
    });

  },

  renderOverlay : function () {
    var openClosedClassName = this.state.open ? "open" : "closed";
    var self = this;
    var listItems = {};
    //check for empty obj or map fails
    if (!_.isEmpty(this.state.rowResults)) {
      listItems = (
        <ul>
          {this.state.rowResults.map(function (res) {

            var currentCellValue = self.props.cell.value;
            var alreadyLinkedClass = "isLinked";
            var contained = _.find(currentCellValue, function (oneVal) {
              return oneVal.id === res.id;
            });

            if (contained) {
              return <li className={alreadyLinkedClass}>{res.values[self.toColumn.id - 1]}</li>;
            } else {
              return <li key={res.id} onClick={self.addLinkValue(res)}>{res.values[self.toColumn.id - 1]}</li>;
            }
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
