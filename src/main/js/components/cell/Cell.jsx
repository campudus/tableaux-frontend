var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var TextCell = require('./TextCell.jsx');
var NumericCell = require('./NumericCell.jsx');
var LinkCell = require('./LinkCell.jsx');
var AttachmentCell = require('./AttachmentCell.jsx');
var BooleanCell = require('./BooleanCell.jsx');

var Cell = React.createClass({
  mixins : [AmpersandMixin],

  displayName : "Cell",

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired
  },

  render : function () {
    switch (this.props.cell.kind) {
      case "link":
        return <LinkCell cell={this.props.cell} language={this.props.langtag}/>;

      case "attachment":
        return <AttachmentCell cell={this.props.cell} language={this.props.langtag}/>;

      case "numeric":
        return <NumericCell cell={this.props.cell} language={this.props.langtag}/>;

      case "boolean":
        return <BooleanCell cell={this.props.cell} language={this.props.langtag}/>;

      default:
        return <TextCell cell={this.props.cell} langtag={this.props.langtag}/>;
    }
  }
});

module.exports = Cell;
