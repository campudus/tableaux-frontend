var app = require('ampersand-app');
var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../dispatcher/Dispatcher');
var Table = require('./Table.jsx');
var LinkOverlay = require('./cells/link/LinkOverlay.jsx');
var GenericOverlay = require('./overlay/GenericOverlay.jsx');
var LanguageSwitcher = require('./header/LanguageSwitcher.jsx');
var NavigationList = require('./header/NavigationList.jsx');
var TableTools = require('./header/TableTools.jsx');
var PageTitle = require('./header/PageTitle.jsx');
var ActionTypes = require('../constants/TableauxConstants').ActionTypes;
var ActionCreator = require('../actions/ActionCreator');

var Tableaux = React.createClass({
  mixins : [AmpersandMixin],

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    tables : React.PropTypes.object.isRequired,
    initialTableId : React.PropTypes.number.isRequired
  },

  nextTableId : null,

  getInitialState : function () {
    return {
      activeOverlay : null, //holds null or { head:{}, body:{}, type:"", footer:[}}
      currentTableId : this.props.initialTableId
    }
  },

  componentWillMount : function () {
    Dispatcher.on(ActionTypes.SWITCHED_TABLE, this.beginSwitchTable);
    Dispatcher.on(ActionTypes.CLEANUP_TABLE_DONE, this.doSwitchTable);
    Dispatcher.on(ActionTypes.OPEN_OVERLAY, this.openOverlay);
    Dispatcher.on(ActionTypes.CLOSE_OVERLAY, this.closeOverlay);
  },

  componentWillUnmount : function () {
    Dispatcher.off(ActionTypes.SWITCHED_TABLE, this.beginSwitchTable);
    Dispatcher.off(ActionTypes.CLEANUP_TABLE_DONE, this.doSwitchTable);
    Dispatcher.off(ActionTypes.OPEN_OVERLAY, this.openOverlay);
    Dispatcher.off(ActionTypes.CLOSE_OVERLAY, this.closeOverlay);
  },

  beginSwitchTable : function (payload) {
    var oldTable = this.props.tables.get(this.state.currentTableId);
    this.nextTableId = payload.tableId;
    ActionCreator.cleanupTable(oldTable);
  },

  doSwitchTable : function () {
    if (this.nextTableId) {
      this.setState({currentTableId : this.nextTableId});
    }
  },

  openOverlay : function (content) {
    this.setState({activeOverlay : content});
  },

  closeOverlay : function () {
    this.setState({activeOverlay : null});
  },

  renderActiveOverlay : function () {
    var overlay = this.state.activeOverlay;
    if (overlay) {
      return (<GenericOverlay key="genericoverlay"
                              head={overlay.head}
                              body={overlay.body}
                              footer={overlay.footer}
                              type={overlay.type}
                              closeOnBackgroundClicked={overlay.closeOnBackgroundClicked}
      />);
    }
  },

  onLanguageSwitch : function (newLangtag) {
    var his = app.router.history;

    var path = his.getPath();

    var newPath = path.replace(this.props.langtag, newLangtag);

    his.navigate(newPath, {trigger : true});
  },

  //TODO: Add overlays only when they are needed: Maybe with a state for each overlay
  render : function () {
    var self = this;
    var tables = this.props.tables;

    var table = '';
    var tableName = '';
    if (typeof tables.get(this.state.currentTableId) !== 'undefined') {
      table = <Table key={this.state.currentTableId} table={tables.get(this.state.currentTableId)}
                     langtag={this.props.langtag}/>;
      tableName = tables.get(this.state.currentTableId).name;
    } else {
      console.error("No table found with id " + this.state.currentTableId);
    }

    return (
      <div>
        <header>
          <NavigationList langtag={this.props.langtag}/>
          <TableTools langtag={this.props.langtag} tableName={tableName} currentTableId={self.state.currentTableId}
                      tables={tables}/>
          <LanguageSwitcher langtag={this.props.langtag} onChange={this.onLanguageSwitch}/>
          <PageTitle title="Tables"/>
        </header>
        <div className="wrapper">
          {table}
        </div>
        {this.renderActiveOverlay()}
      </div>
    );
  }
});

module.exports = Tableaux;