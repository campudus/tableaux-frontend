var React = require("react");
var _ = require("lodash");
var Dispatcher = require("../../../dispatcher/Dispatcher");
var LinkOverlay = require("./LinkOverlay.jsx");
var LinkLabelCell = require("./LinkLabelCell.jsx");
var LinkEditCell = require("./LinkEditCell.jsx");

var LinkCell = React.createClass({

  propTypes: {
    cell: React.PropTypes.object.isRequired,
    langtag: React.PropTypes.string.isRequired,
    selected: React.PropTypes.bool.isRequired,
    editing: React.PropTypes.bool.isRequired,
    setCellKeyboardShortcuts: React.PropTypes.func
  },

  getInitialState: function () {
    return null;
  },

  render: function () {
    var self = this;

    if (self.props.selected) {
      return <LinkEditCell cell={self.props.cell} langtag={self.props.langtag}
                           editing={self.props.editing}
                           setCellKeyboardShortcuts={self.props.setCellKeyboardShortcuts}></LinkEditCell>;
    } else {
      // Show a link preview for performance
      var tooManyLinks = false;
      var links = self.props.cell.value.map(function (element, index) {
        // Limit to maximum 3 Links
        if (index <= 2) {
          return <LinkLabelCell key={element.id} linkElement={element} linkIndexAt={index} cell={self.props.cell}
                                langtag={self.props.langtag}
                                deletable={false}/>;
        } else {
          tooManyLinks = true;
          return null;
        }
      }).filter(Boolean); // remove null and empty array values: http://stackoverflow.com/a/13798078

      // More note ...
      if (tooManyLinks) {
        links.push(<span key={"more"} className="more">&hellip;</span>);
      }
      return (
          <div className={"cell-content"}>
            {links}
          </div>
      );
    }
  }

});

module.exports = LinkCell;
