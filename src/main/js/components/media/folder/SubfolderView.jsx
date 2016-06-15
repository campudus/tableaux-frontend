var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var ActionCreator = require('../../../actions/ActionCreator');

var SubfolderView = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'SubfolderView',

  propTypes : {
    folder : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    onRemove : React.PropTypes.func.isRequired,
    onEdit : React.PropTypes.func.isRequired
  },

  folderClickHandler : function (event) {
    event.preventDefault();
    ActionCreator.switchFolder(this.props.folder.id, this.props.langtag);
  },

  render : function () {
    var name = this.props.folder.name + '/';

    return (
      <div>
        <a className="folder-link" onClick={this.folderClickHandler}>
          <i className="icon fa fa-folder-open"></i><span>{name}</span>
        </a>
        <div className="media-options">
          <span className="button" onClick={this.props.onEdit} alt="edit">
          <i className="icon fa fa-pencil-square-o"></i> umbenennen
        </span>
        <span className="button" onClick={this.props.onRemove} alt="delete">
          <i className="fa fa-trash"></i>
        </span>
        </div>
      </div>
    );
  }
});

module.exports = SubfolderView;
