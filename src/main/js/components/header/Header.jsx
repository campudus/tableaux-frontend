var React = require('react');
var LanguageSwitcher = require('./LanguageSwitcher.jsx');
var NavigationList = require('./NavigationList.jsx');
var TableTools = require('./TableTools.jsx');

var Header = React.createClass({

  propTypes : {
    tableName : React.PropTypes.string.isRequired,
    langtag : React.PropTypes.string.isRequired
  },

  render : function () {
    return (
      <header>
        <NavigationList langtag={this.props.langtag}/>
        <TableTools langtag={this.props.langtag} tableName={this.props.tableName}/>
        <LanguageSwitcher langtag={this.props.langtag}/>
      </header>
    )
  }
});

module.exports = Header;