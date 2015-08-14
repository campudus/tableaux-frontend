var React = require('react');
var Dispatcher = require('../../Dispatcher');
var apiUrl = require('../../apiUrl');
var _ = require('lodash');

var AttachmentCell = React.createClass({

  render : function () {
    var self = this;

    var cell = this.props.cell;

    console.log("AttachmentCell.render", cell.value);

    return (
      <div className={'cell attachment cell-' + cell.column.getId() + '-' + cell.rowId}>
        {_.map(cell.value, function (attachment) {
          return <div key={attachment.uuid}><a href={apiUrl(attachment.url)}>{attachment.name}</a></div>
        })}
      </div>
    );
  }

});

module.exports = AttachmentCell;
