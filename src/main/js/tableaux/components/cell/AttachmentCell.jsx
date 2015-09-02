var React = require('react');
var Dispatcher = require('../../Dispatcher');
var apiUrl = require('../../apiUrl');
var _ = require('lodash');

var AttachmentCell = React.createClass({

  openOverlay : function () {
    Dispatcher.trigger('openMediaOverlay', this.props.cell);
  },

  render : function () {
    var self = this;

    var cell = this.props.cell;

    return (
      <div className={'cell attachment cell-' + cell.column.getId() + '-' + cell.rowId}>
        {_.map(cell.value, function (attachment) {
          return <div key={attachment.uuid}><a href={apiUrl(attachment.url)} target="_blank">{attachment.name}</a></div>
        })}
        <button className="add" onClick={self.openOverlay}>+</button>
      </div>
    );
  }

});

module.exports = AttachmentCell;
