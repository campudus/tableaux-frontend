var app = require('ampersand-app');
var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../dispatcher/Dispatcher');
var Table = require('./Table.jsx');
var LinkOverlay = require('./cells/link/LinkOverlay.jsx');
var MediaOverlay = require('./media/MediaOverlay.jsx');
var GenericOverlay = require('./overlay/GenericOverlay.jsx');
var LanguageSwitcher = require('./header/LanguageSwitcher.jsx');
var NavigationList = require('./header/NavigationList.jsx');
var TableTools = require('./header/TableTools.jsx');
var PageTitle = require('./header/PageTitle.jsx');
var ActionTypes = require('../constants/TableauxConstants').ActionTypes;

var Tableaux = React.createClass({
  mixins : [AmpersandMixin],
  displayName : 'Tableaux',

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    tables : React.PropTypes.object.isRequired,
    initialTableId : React.PropTypes.number.isRequired
  },

  getInitialState : function () {
    return {
      activeOverlay : null, //holds null or { head:{}, body:{}, type:""}
      currentTableId : this.props.initialTableId
    }
  },

  componentWillMount : function () {
    Dispatcher.on(ActionTypes.SWITCHED_TABLE, this.switchTable);
    Dispatcher.on('open-overlay', this.openOverlay);
    Dispatcher.on('close-overlay', this.closeOverlay);
  },

  componentWillUnmount : function () {
    Dispatcher.off(ActionTypes.SWITCHED_TABLE, this.switchTable);
    Dispatcher.off('open-overlay', this.openOverlay);
    Dispatcher.off('close-overlay', this.closeOverlay);
  },

  switchTable : function (payload) {
    var self = this;
    console.log('Tableaux.switchTable', payload);
    //if (this.props.tables) {

    //Clear current/old collections
    var oldTable = this.props.tables.get(this.state.currentTableId);
    oldTable.rows.reset();
    oldTable.columns.reset();
    self.setState({currentTableId : payload.tableId});

    /*} else {
      // refresh Tables collection
      this.props.tables.fetch({
        success : function (collection, response, options) {
     console.log("Tableaux switchTable fetch");
     self.setState({currentTableId : payload.tableId});
        },
        error : function (collection, response, options) {
          console.error("Error fetching Table in switchTable");
        }
      });
     }*/


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
                              type={overlay.type}
                              closeOnBackgroundClicked={overlay.closeOnBackgroundClicked}
      />);
    }
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
            <LanguageSwitcher langtag={this.props.langtag}/>
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