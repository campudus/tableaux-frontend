import React from "react";
import _ from "lodash";
import LinkOverlay from "./LinkOverlay.jsx";
import LinkLabelCell from "./LinkLabelCell.jsx";
import OverlayHeadRowIdentificator from "../../overlay/OverlayHeadRowIdentificator.jsx";
import ActionCreator from "../../../actions/ActionCreator";
import AmpersandMixin from "ampersand-react-mixin";

const LinkEditCell = React.createClass({

  mixins: [AmpersandMixin],

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

  removeLink: function (idx) {
    var cell = this.props.cell;
    var newValue = _.filter(cell.value, function (element, arrayIndex) {
      return element.id !== idx;
    });
    ActionCreator.changeCell(cell, newValue);
  },

  openOverlay: function () {
    ActionCreator.openOverlay({
      head: <OverlayHeadRowIdentificator cell={this.props.cell} langtag={this.props.langtag}/>,
      body: <LinkOverlay cell={this.props.cell} langtag={this.props.langtag}/>,
      type: "no-scroll"
    });
  },

  render: function () {
    var self = this;
    var links = self.props.cell.value.map(function (element, index) {
      return <LinkLabelCell key={element.id} deletable={true} linkElement={element}
                              cell={self.props.cell} langtag={self.props.langtag} onDelete={self.removeLink}
                              linkIndexAt={index}/>;
    });

    links.push(<button key={"add-btn"} className="add" onClick={self.openOverlay}>+</button>);

    return (
        <div className={"cell-content"}>
          {links}
        </div>
    );
  }

})
  ;

module.exports = LinkEditCell;
