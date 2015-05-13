var React = require('react');
var dispatcher = require('../TableauxDispatcher');
var TableauxConstants = require('../TableauxConstants');

var TableCreator = React.createClass({
  handleClick : function () {
    console.log('creating new table');
    var data = {
      tableName : this.refs.input.getDOMNode().value
    };
    dispatcher.emit(TableauxConstants.CREATE_TABLE, data);
  },

  render : function () {
    return (
      <div className="create-table">
        <input type="text" name="table-name" ref="input"/>
        <button type="button" className="create-table" onClick={this.handleClick}>
          Neue Tabelle erstellen
        </button>
      </div>
    );
  }
});

module.exports = TableCreator;
