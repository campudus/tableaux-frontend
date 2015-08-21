var app = require('ampersand-app');
var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../Dispatcher');

var Header = require('./header/Header.jsx');
var TableSwitcher = require('./header/TableSwitcher.jsx');
var Table = require('./Table.jsx');
var LinkOverlay = require('./LinkOverlay.jsx');
var MediaOverlay = require('./MediaOverlay.jsx');

var Tableaux = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'Tableaux',

  propTypes : {
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

    var currentLanguage = "de_DE";

    var table = '';
    var title = '';
    if (typeof tables.get(this.state.currentTableId) !== 'undefined') {
      table = <Table key={this.state.currentTableId} table={tables.get(this.state.currentTableId)}/>
      title = tables.get(this.state.currentTableId).name;
    } else {
      console.error("No table found with id " + this.state.currentTableId);
    }

    return (
      <div>
        <Header key="header" title={title} subtitle={'Sie arbeiten in der Tabelle'} />

        <div className="wrapper">
          <TableSwitcher key="tableswitcher" currentId={self.state.currentTableId} tables={tables}/>
          {table}
        </div>

        <LinkOverlay key="linkoverlay" language={currentLanguage}/>
        <MediaOverlay key="mediaoverlay" language={currentLanguage}/>
      </div>
    );
  }
});

module.exports = Tableaux;