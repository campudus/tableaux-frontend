var React = require('react');
var App = require('ampersand-app');

var ViewSwitcher = React.createClass({

  propTypes : {
    langtag : React.PropTypes.string.isRequired
  },

  onChange : function (event) {
    event.preventDefault();

    var langtag = this.refs.langSwitcher.getDOMNode().value;

    var his = App.router.history;

    var path = his.getPath();

    var newPath = path.replace(this.props.langtag, langtag);

    console.log('ViewSwitcher.onChange', path, newPath);

    his.navigate(newPath, {trigger : true});

    console.log(langtag);
  },

  render : function () {
    var options = App.langtags.map(function (langtag) {
      return <option key={langtag} value={langtag}>{langtag}</option>;
    });

    return (
      <div id="switch-view">
        <select onChange={this.onChange} ref="langSwitcher" defaultValue={this.props.langtag}>
          {options}
        </select>
      </div>
    )
  }
});

module.exports = ViewSwitcher;