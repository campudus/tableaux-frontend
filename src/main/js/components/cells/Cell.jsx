var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var TextCell = require('./text/TextCell.jsx');
var NumericCell = require('./numeric/NumericCell.jsx');
var LinkCell = require('./link/LinkCell.jsx');
var AttachmentCell = require('./attachment/AttachmentCell.jsx');
var BooleanCell = require('./boolean/BooleanCell.jsx');
var DateTimeCell = require('./datetime/DateTimeCell.jsx');

var Cell = React.createClass({
  mixins : [AmpersandMixin],

  displayName : "Cell",

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired
  },

  render : function () {
    switch (this.props.cell.kind) {

      //todo: switch language to langtag!!! Important LANGTAG

      case "link":
        return <LinkCell cell={this.props.cell} language={this.props.langtag}/>;

      case "attachment":
        return <AttachmentCell cell={this.props.cell} language={this.props.langtag}/>;

      case "numeric":
        return <NumericCell cell={this.props.cell} language={this.props.langtag}/>;

      case "boolean":
        return <BooleanCell cell={this.props.cell} language={this.props.langtag}/>;

      case "datetime":
        return <DateTimeCell cell={this.props.cell} language={this.props.langtag}/>;

      default:
        return <TextCell cell={this.props.cell} langtag={this.props.langtag}/>;
    }
  }
});

module.exports = Cell;
