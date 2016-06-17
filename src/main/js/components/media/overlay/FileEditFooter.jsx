var React = require('react');
var App = require('ampersand-app');
import {translate} from 'react-i18next';

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

module.exports = translate(['media'])(FileEditFooter);
