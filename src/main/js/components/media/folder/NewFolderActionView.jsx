var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var NewFolderActionView = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'NewFolderActionView',

  propTypes : {
    callback : React.PropTypes.func.isRequired
  },

  render : function () {
    return (
      <div className="new-folder-button" onClick={this.props.callback}>
        <i className="icon fa fa-plus"></i><span>Neuen Ordner erstellen</span>
      </div>
    );
  }
});

module.exports = NewFolderActionView;
