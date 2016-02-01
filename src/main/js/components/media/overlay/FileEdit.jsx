var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var SingleFileEdit = require('./SingleFileEdit.jsx');
var MultiFileEdit = require('./MultiFileEdit.jsx');

var FileEdit = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'FileEdit',

  propTypes : {
    file : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    onClose : React.PropTypes.func.isRequired
  },

  render : function () {
    var file = this.props.file;
    var overlayBody;
    if (file.internalName && Object.keys(file.internalName).length > 1) {
      overlayBody = <MultiFileEdit file={this.props.file} langtag={this.props.langtag} onClose={this.props.onClose}/>;
    } else {
      overlayBody = <SingleFileEdit file={this.props.file} langtag={this.props.langtag} onClose={this.props.onClose}/>;
    }

    return overlayBody;

  }
});

module.exports = FileEdit;
