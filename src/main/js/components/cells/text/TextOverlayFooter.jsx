var React = require('react');
var ActionCreator = require('../../../actions/ActionCreator');

var TextOverlayFooter = React.createClass({

  onSaveHandler : function () {
    ActionCreator.saveOverlayTypeText();
  },

  onCancelHandler : function () {
    ActionCreator.closeOverlayTypeText();
  },

  render : function () {
    return (
      <div className="button-wrapper">
        <button className="button positive" onClick={this.onSaveHandler}>Speichern</button>
        <button className="button neutral" onClick={this.onCancelHandler}>Abbrechen</button>
      </div>
    );
  }
});

module.exports = TextOverlayFooter;
