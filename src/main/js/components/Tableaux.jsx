var app = require('ampersand-app');
var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var Dispatcher = require('../dispatcher/Dispatcher');

var Header = require('./header/Header.jsx');
var TableSwitcher = require('./header/TableSwitcher.jsx');
var Table = require('./Table.jsx');
var LinkOverlay = require('./LinkOverlay.jsx');
var MediaOverlay = require('./MediaOverlay.jsx');
var GenericOverlay = require('./GenericOverlay.jsx');

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
    var title = '';
    if (typeof tables.get(this.state.currentTableId) !== 'undefined') {
      table = <Table key={this.state.currentTableId} table={tables.get(this.state.currentTableId)} langtag={this.props.langtag}/>;
      title = tables.get(this.state.currentTableId).name;
    } else {
      console.error("No table found with id " + this.state.currentTableId);
    }

    return (
      <div>
        <Header key="header" title={title} subtitle={'Sie arbeiten in der Tabelle'} langtag={this.props.langtag}/>

        <div className="wrapper">
          <TableSwitcher key="tableswitcher" currentId={self.state.currentTableId} tables={tables} langtag={this.props.langtag}/>
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