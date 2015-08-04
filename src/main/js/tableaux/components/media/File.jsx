var React = require('react');
var apiUrl = require('../../apiUrl');
var AmpersandMixin = require('ampersand-react-mixin');

var File = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'File',

  onRemove : function() {
    this.props.file.destroy({
      success: function () {
        console.log('File destroyed!');
      },
      error: function () {
        console.log('There was an error destroying the file');
      }
    });
  },

  render : function () {
    var name = this.props.file.name;
    var link = apiUrl(this.props.file.fileUrl);

    return (
      <li><a href={link}><span className="file">{name}</span></a> <span onClick={this.onRemove}>x</span></li>
    );
  }
});

module.exports = File;
