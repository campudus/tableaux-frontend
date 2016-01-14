var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../../dispatcher/Dispatcher');
var NewFolderActionView = require('./NewFolderActionView.jsx');
var SubfolderEdit = require('./SubfolderEdit.jsx');
var SimpleFolder = require('../../models/media/SimpleFolder');

var NewFolderAction = React.createClass({

  mixins : [AmpersandMixin],

  displayName : 'NewFolderAction',

  propTypes : {
    parentFolder : React.PropTypes.object.isRequired
  },

  getInitialState : function () {
    return {
      edit : false
    }
  },

  onEdit : function () {
    this.setState({
      edit : !this.state.edit
    });
  },

  onSave : function (folder) {
    this.onEdit();
    if (folder) {
      console.log("Folder.added", folder.toJSON());
      Dispatcher.trigger('add-folder', folder.toJSON());
    }
  },

  render : function () {
    var newFolderAction;
    if (this.state.edit) {
      var folder = new SimpleFolder({
        name : "Neuer Ordner",
        description : "",
        parent : this.props.parentFolder.getId()
      });
      newFolderAction = <SubfolderEdit folder={folder} callback={this.onSave}/>;
    } else {
      newFolderAction = <NewFolderActionView callback={this.onEdit}/>;
    }

    return (
      <div className="media-switcher">
        <ul>
          <li>
            {newFolderAction}
          </li>
        </ul>
      </div>
    );
  }
});

module.exports = NewFolderAction;