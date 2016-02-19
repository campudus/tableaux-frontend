var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../dispatcher/Dispatcher');
var Table = require('./Table.jsx');
var LanguageSwitcher = require('./header/LanguageSwitcher.jsx');
import NavigationList from './header/NavigationList.jsx';
import PageTitle from './header/PageTitle.jsx';
var TableSwitcher = require('./header/TableSwitcher.jsx');
var ActionTypes = require('../constants/TableauxConstants').ActionTypes;
var ActionCreator = require('../actions/ActionCreator');
var Tables = require('../models/Tables');
var RowFilter = require('./header/RowFilter.jsx');

var TableView = React.createClass({
  mixins : [AmpersandMixin],

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    overlayOpen : React.PropTypes.bool.isRequired,
    tableId : React.PropTypes.number,
  },

  nextTableId : null,

  getInitialState : function () {
    return {
      isLoading : true,
      currentTableId : this.props.tableId
    }
  },

  componentWillMount : function () {
    Dispatcher.on(ActionTypes.CLEANUP_TABLE_DONE, this.doSwitchTable);

    var self = this;
    //fetch all tables
    if (!this.tables) {
      this.tables = new Tables();
      this.tables.fetch({
        success : function (collection) {
          if (self.props.tableId === null) {
            ActionCreator.switchTable(collection.at(0).getId(), self.props.langtag);
          } else {
            self.setState({
              isLoading : false
            });
          }
        }
      });
    }
  },

  componentWillUnmount : function () {
    Dispatcher.off(ActionTypes.CLEANUP_TABLE_DONE, this.doSwitchTable);
  },

  componentWillReceiveProps : function (nextProps) {
    if (nextProps.tableId !== this.props.tableId) {
      var oldTable = this.tables.get(this.state.currentTableId);
      this.nextTableId = nextProps.tableId;
      if (oldTable) {
        ActionCreator.cleanupTable(oldTable);
      } else {
        this.doSwitchTable();
      }
    }
  },

  shouldComponentUpdate : function (nextProps, nextState) {
    var shouldRenderPropUpdate = nextProps.langtag !== this.props.langtag || nextProps.overlayOpen !== this.props.overlayOpen;
    var shouldRenderStateUpdate = nextState.isLoading !== this.state.isLoading || nextState.currentTableId !== this.state.currentTableId;
    return shouldRenderPropUpdate || shouldRenderStateUpdate;
  },

  doSwitchTable : function () {
    if (this.nextTableId) {
      this.setState({
        isLoading : false,
        currentTableId : this.nextTableId
      });
    }
  },

  onLanguageSwitch : function (newLangtag) {
    ActionCreator.switchLanguage(newLangtag);
  },

  render : function () {
    if (this.state.isLoading) {
      return <div className="spinner">Loading</div>;
    } else {

      var self = this;
      var tables = this.tables;

      var table = '';
      var tableName = '';
      if (this.state.currentTableId) {
        if (typeof tables.get(this.state.currentTableId) !== 'undefined') {
          table = <Table key={this.state.currentTableId} table={tables.get(this.state.currentTableId)}
                         langtag={this.props.langtag} overlayOpen={this.props.overlayOpen}/>;
          tableName = tables.get(this.state.currentTableId).name;
        } else {
          //TODO show error to user
          console.error("No table found with id " + this.state.currentTableId);
        }
      }

      return (
        <div>
          <header>
            <NavigationList langtag={this.props.langtag}/>
            <TableSwitcher langtag={this.props.langtag}
                           tableName={tableName}
                           currentTableId={self.state.currentTableId}
                           tables={tables}/>
            <RowFilter />
            <LanguageSwitcher langtag={this.props.langtag} onChange={this.onLanguageSwitch}/>
            <PageTitle titleKey="pageTitle.tables"/>
          </header>
          <div className="wrapper">
            {table}
          </div>
        </div>
      );
    }
  }
});

module.exports = TableView;