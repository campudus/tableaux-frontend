var React = require('react');
var RowIdentifier = require('../helper/RowIdentifier');
var App = require('ampersand-app');
var Dispatcher = require('../../dispatcher/Dispatcher.js');

var OverlayHeadRowIdentificator = React.createClass({

  mixins : [RowIdentifier],

  propTypes : {
    cell : React.PropTypes.object,
    langtag : React.PropTypes.string
  },

  rowIdentifierString : "",

  handleTableSwitchClicked : function () {
    Dispatcher.trigger("close-overlay");
    App.router.history.navigate(this.props.langtag + '/table/' + this.props.cell.column.toTable, {trigger : true});
  },

  componentWillMount : function () {
    this.rowIdentifierString = RowIdentifier.getRowIdentifierByOtherCell(this.props.cell, this.props.langtag);
    console.log("rowIdentifierString:", this.rowIdentifierString);
  },

  render : function () {

    var rowIdentification = null;
    if (this.rowIdentifierString !== "") {
      rowIdentification = <span className="row-identification-value">{this.rowIdentifierString}</span>;
    }

    if (this.props.cell != null) {
      if (this.props.cell.isLink) {
        return (
            <span>
            <span onClick={this.handleTableSwitchClicked} className="column-name with-link">
              <i className="fa fa-columns"></i>{this.props.cell.column.name}</span>{rowIdentification}
          </span>
        );

      } else {
        return (
            <span>
            <span className="column-name">{this.props.cell.column.name}: </span>{rowIdentification}
          </span>
        );

      }
    } else {
      return null;
    }
  }

});

module.exports = OverlayHeadRowIdentificator;
