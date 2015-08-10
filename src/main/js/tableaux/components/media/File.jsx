var React = require('react');
var apiUrl = require('../../apiUrl');
var AmpersandMixin = require('ampersand-react-mixin');

var File = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'File',

  onRemove : function () {
    this.props.file.destroy({
      success : function () {
        console.log('File destroyed!');
      },
      error : function () {
        console.log('There was an error destroying the file');
      }
    });
  },

  render : function () {
    var name = this.props.file.name;
    var link = apiUrl(this.props.file.fileUrl);

    var deleteButton = <span className="delete fa fa-remove" onClick={this.onRemove}></span>;

    return (
      <div className="file">
        <a href={link}><span>{name}</span></a>
        {deleteButton}
      </div>
    );
  }
});

module.exports = File;
