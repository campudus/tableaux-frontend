var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var Subfolder = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'Subfolder',

  render : function () {
    var name = this.props.folder.name + '/';
    var link = '/media.html?folder=' + this.props.folder.id;

    return (
      <li><a href={link}><span className="subfolder">{name}</span></a></li>
    );
  }
});

module.exports = Subfolder;
