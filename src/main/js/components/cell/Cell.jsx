var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var TextCell = require('./TextCell.jsx');
var NumericCell = require('./NumericCell.jsx');
var LinkCell = require('./LinkCell.jsx');
var AttachmentCell = require('./AttachmentCell.jsx');

var Cell = React.createClass({
  mixins : [AmpersandMixin],

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    language : React.PropTypes.string.isRequired
  },

  render : function () {
    var cell = this.props.cell;
    var language = this.props.language;

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
        return <TextCell cell={cell} language={language}/>;
    }
  }
});

module.exports = Cell;
