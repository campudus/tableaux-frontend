var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var TextCell = require('./TextCell.jsx');
var NumericCell = require('./NumericCell.jsx');
var LinkCell = require('./LinkCell.jsx');
var AttachmentCell = require('./AttachmentCell.jsx');

var Cell = React.createClass({
  mixins : [AmpersandMixin],

  displayName : "Cell",

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired
  },

  render : function () {
    var cell = this.props.cell;
    var language = this.props.langtag;

    switch (cell.kind) {
      case "link":
        return <LinkCell cell={cell} language={language}/>;
        break;

      case "attachment":
        return <AttachmentCell cell={cell}/>;
        break;
      case "numeric":
        return <NumericCell cell={cell} language={language}/>;
        break;

      default:
        return <TextCell cell={cell} langtag={language}/>;
    }
  }
});

module.exports = Cell;
