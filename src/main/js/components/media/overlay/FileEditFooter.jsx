var React = require('react');
var App = require('ampersand-app');

var FileEditFooter = React.createClass({
  displayName : 'FileEditFooter',

  propTypes : {
    onSave : React.PropTypes.func.isRequired,
    onCancel : React.PropTypes.func.isRequired
  },

  render : function () {
    return (
      <div className="button-wrapper">
        <button className="button positive" onClick={this.props.onSave}>Speichern</button>
        <button className="button neutral" onClick={this.props.onCancel}>Abbrechen</button>
      </div>
    );
  }
});

module.exports = FileEditFooter;
