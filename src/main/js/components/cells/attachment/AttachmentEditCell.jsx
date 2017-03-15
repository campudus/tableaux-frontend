var React = require("react");
var _ = require("lodash");
var AttachmentOverlay = require("./AttachmentOverlay.jsx");
var AttachmentLabelCell = require("./AttachmentLabelCell.jsx");
var OverlayHeadRowIdentificator = require("../../overlay/OverlayHeadRowIdentificator.jsx");
var ActionCreator = require("../../../actions/ActionCreator");

var AttachmentEditCell = React.createClass({

  mixins: [],

  propTypes: {
    cell: React.PropTypes.object.isRequired,
    langtag: React.PropTypes.string.isRequired,
    editing: React.PropTypes.bool.isRequired,
    setCellKeyboardShortcuts: React.PropTypes.func
  },

  componentDidMount: function () {
    var self = this;
    this.props.setCellKeyboardShortcuts({
      enter: function (event) {
        // stop handling the Table events
        event.stopPropagation();
        event.preventDefault();
        self.openOverlay();
      }
    });
  },

  componentWillUnmount: function () {
    // Important to clean up the keyboard shortcuts
    this.props.setCellKeyboardShortcuts({});
  },

  removeAttachment: function (file) {
    var cell = this.props.cell;

    return function () {
      var attachments = _.clone(cell.value);

      _.remove(attachments, function (attachment) {
        return file.uuid === attachment.uuid;
      });

      ActionCreator.changeCell(cell, attachments);
    };
  },

  openOverlay: function () {
    ActionCreator.openOverlay({
      head: <OverlayHeadRowIdentificator cell={this.props.cell} langtag={this.props.langtag}/>,
      body: <AttachmentOverlay cell={this.props.cell} langtag={this.props.langtag}/>,
      type: "normal"
    });
  },

  render: function () {
    var self = this;
    var attachments = self.props.cell.value.map(function (element, arrayIndex) {
      return <AttachmentLabelCell key={arrayIndex} id={element.id} deletable={true} attachmentElement={element}
                                  cell={self.props.cell} langtag={self.props.langtag}
                                  onDelete={self.removeAttachment(element)}/>;
    });

    attachments.push(<button key={"add-btn"} className="add" onClick={self.openOverlay}>+</button>);

    return (
      <div className={"cell-content"}>
        {attachments}
      </div>
    );
  }

});

module.exports = AttachmentEditCell;
