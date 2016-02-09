var React = require('react');
var _ = require('lodash');

var apiUrl = require('../../../helpers/apiUrl');
var ActionCreator = require('../../../actions/ActionCreator');

var OverlayHeadRowIdentificator = require('../../overlay/OverlayHeadRowIdentificator.jsx');
var AttachmentOverlay = require('./AttachmentOverlay.jsx');

var AttachmentCell = React.createClass({

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired
  },

  openOverlay : function () {
    ActionCreator.openOverlay({
      head : <OverlayHeadRowIdentificator cell={this.props.cell} langtag={this.props.langtag}/>,
      body : <AttachmentOverlay cell={this.props.cell} langtag={this.props.langtag}/>,
      type : "normal"
    });
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
