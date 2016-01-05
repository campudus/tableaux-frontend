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

var Tableaux = React.createClass({
  mixins : [AmpersandMixin],
  displayName : 'Tableaux',

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    tables : React.PropTypes.object.isRequired,
    initialTableId : React.PropTypes.number.isRequired
  },

  switchTable : function (event) {
    console.log('Tableaux.switchTable', event);
    // refresh Tables collection
    this.props.tables.fetch();
    this.setState({currentTableId : event.id});
  },

  componentWillMount : function () {
    Dispatcher.on('switch-table', this.switchTable);
  },

  componentWillUnmount : function () {
    Dispatcher.off('switch-table', this.switchTable);
  },

  getInitialState : function () {
    return {currentTableId : this.props.initialTableId};
  },

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
        <LinkOverlay key="linkoverlay" language={this.props.langtag}/>
        <MediaOverlay key="mediaoverlay" language={this.props.langtag}/>
        <GenericOverlay key="genericoverlay" language={this.props.langtag}/>
      </div>
    );
  }
});

module.exports = Tableaux;