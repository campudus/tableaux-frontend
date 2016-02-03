var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var SubfolderView = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'SubfolderView',

  propTypes : {
    folder : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    onRemove : React.PropTypes.func.isRequired,
    onEdit : React.PropTypes.func.isRequired
  },

  render : function () {
    var name = this.props.folder.name + '/';
    var link = '/' + this.props.langtag + '/media/' + this.props.folder.id;

    return (
      <div>
        <a href={link}>
          <i className="icon fa fa-folder-open"></i><span>{name}</span>
        </a>
        <span className="button" onClick={this.props.onRemove} alt="delete">
          <i className="fa fa-remove"></i>
        </span>
        <span className="button" onClick={this.props.onEdit} alt="edit">
          <i className="icon fa fa-pencil-square-o"></i>
        </span>
      </div>
    );
  }
});

module.exports = SubfolderView;
