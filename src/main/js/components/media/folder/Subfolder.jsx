var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var SubfolderView = require('./SubfolderView.jsx');
var SubfolderEdit = require('./SubfolderEdit.jsx');

var Subfolder = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'Subfolder',

  propTypes : {
    folder : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired
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
      console.log("Folder.changed", folder.toJSON());
      Dispatcher.trigger('change-folder', folder.toJSON());
    }
  },

  onRemove : function () {
    if (confirm("Soll der Ordner '" + this.props.folder.name + "' wirklich gelöscht werden? Es werden auch alle Unterordner und enthaltene Dateien gelöscht. Dies kann nicht rückgängig gemacht werden!")) {
      console.log('Folder.onRemove', this.props.folder.getId());

      this.props.folder.destroy({
        success : function () {
          console.log('Folder was deleted.');
        },
        error : function () {
          console.log('There was an error deleting the folder.');
        }
      });
    }
  },

  render : function () {
    var subfolder;
    if (this.state.edit) {
      subfolder = <SubfolderEdit folder={this.props.folder} callback={this.onSave}/>;
    } else {
      subfolder = <SubfolderView folder={this.props.folder}
                                 langtag={this.props.langtag}
                                 onRemove={this.onRemove}
                                 onEdit={this.onEdit}/>;
    }

    return (
      <div className="subfolder">
        {subfolder}
      </div>
    );
  }
});

module.exports = Subfolder;