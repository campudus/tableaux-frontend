var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var _ = require('lodash');
var OverlayHeadRowIdentificator = require('../../overlay/OverlayHeadRowIdentificator.jsx');
var Dispatcher = require('../../../dispatcher/Dispatcher');

var LinkOverlay = React.createClass({
  mixins : [AmpersandMixin],

  getInitialState : function () {
    return {
      search : "",
      rowResults : {},
    };
  },

  propTypes : {
    cell : React.PropTypes.object,
    langtag : React.PropTypes.string.isRequired,
    tableId : React.PropTypes.number
  },

  componentDidMount : function () {
    //TODO: Get rows of the linked table: Maybe in componentWillMount
  },

  componentWillMount : function () {

  },

  componentWillUnmount : function () {

  },

  onSearch : function (event) {
    console.log("LinkOverlay.onSearch");
    var search = this.refs.search.value;
    this.setState({
      search : search
    });
  },

  addLinkValue : function (isLinked, row) {
    var cell = this.props.cell;
    var link = {
      id : row.id,
      // TODO id != position
      value : row.values[cell.column.toColumn.id - 1]
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

  openOverlay : function () {
    var self = this;
    var toColumn = this.props.cell.column.toColumn;
    var toTable = this.props.cell.column.toTable;

    this.props.cell.fetch({
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
    Dispatcher.trigger('close-overlay');
  },

  renderOverlay : function () {
    var self = this;
    var listItems = null;

    //check for empty obj or map fails
    if (!_.isEmpty(this.state.rowResults)) {
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
    } else {
      listItems = "No Rows";
    }

    return (
      <div>
        <div className="search-input-wrapper">
          <input type="text" className="search-input" placeholder="Search..." onChange={this.onSearch}
                 defaultValue={this.state.search} ref="search"/>
          <i className="fa fa-search"></i>
        </div>
        {listItems}
      </div>
    );
  },

  render : function () {
    return this.renderOverlay();
  }

});

module.exports = LinkOverlay;
