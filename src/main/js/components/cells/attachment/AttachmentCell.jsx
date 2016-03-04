var React = require('react');
var AttachmentLabelCell = require('./AttachmentLabelCell.jsx');
var AttachmentEditCell = require('./AttachmentEditCell.jsx');

var AttachmentCell = React.createClass({

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    selected : React.PropTypes.bool.isRequired,
    editing : React.PropTypes.bool.isRequired,
    setCellKeyboardShortcuts : React.PropTypes.func
  },


  getInitialState : function () {
    return null;
  },

  render : function () {
    var self = this;

    if (self.props.selected) {
      return <AttachmentEditCell cell={self.props.cell} langtag={self.props.langtag}
                                 editing={self.props.editing}
                                 setCellKeyboardShortcuts={self.props.setCellKeyboardShortcuts}></AttachmentEditCell>
    } else {
      //Show a attachment preview for performance
      var tooManyAttachments = false;
      var attachments = self.props.cell.value.map(function (element, id) {

        //Limit to maximum 3 Links
        if (id <= 2) {
          return <AttachmentLabelCell key={id} attachmentElement={element} cell={self.props.cell}
                                      langtag={self.props.langtag}
                                      deletable={false}/>;
        } else {
          tooManyAttachments = true;
          return null;
        }

      }).filter(Boolean); //remove null and empty array values: http://stackoverflow.com/a/13798078

      //More note ...
      if (tooManyAttachments) {
        attachments.push(<span key={"more"} className="more">&hellip;</span>);
      }
      return (
        <div className={'cell-content'}>
          {attachments}
        </div>
      );

    }
  }

});

module.exports = AttachmentCell;
