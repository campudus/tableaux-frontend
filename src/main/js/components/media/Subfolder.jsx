var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var Subfolder = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'Subfolder',

  render : function () {
    var name = this.props.folder.name + '/';
    var link = '/media/' + this.props.folder.id;

    return (
      <a href={link}><span className="subfolder">{name}</span></a>
    );
  }
});

module.exports = Subfolder;
