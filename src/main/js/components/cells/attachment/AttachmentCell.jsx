var React = require('react');
var _ = require('lodash');

var Dispatcher = require('../../../dispatcher/Dispatcher');
var apiUrl = require('../../../helpers/apiUrl');

var AttachmentCell = React.createClass({

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired
  },

  openOverlay : function () {
    Dispatcher.trigger('openMediaOverlay', this.props.cell);
  },

  render : function () {
    var self = this;

    var cell = this.props.cell;

    return (
      <div className={'cell-content attachment'}>
        {_.map(cell.value, function (attachment) {
          return <div key={attachment.uuid}><a href={apiUrl(attachment.url)} target="_blank">{attachment.name}</a></div>
        })}
        <button className="add" onClick={self.openOverlay}>+</button>
      </div>
    );
  }

});

module.exports = AttachmentCell;
