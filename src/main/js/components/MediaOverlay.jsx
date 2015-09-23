var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var _ = require('lodash');

var Dispatcher = require('../dispatcher/Dispatcher');

var Folder = require('../models/media/Folder');

var MediaOverlay = React.createClass({
  mixins : [AmpersandMixin],

  getInitialState : function () {
    return {open : false, folder : {}, columnName : "", cell : {}};
  },

  componentWillMount : function () {
    Dispatcher.on('openMediaOverlay', this.openOverlay);
  },

  componentWillUnmount : function () {
    Dispatcher.off('openMediaOverlay', this.openOverlay);
  },

  navigateFolder : function (folderId) {
    var self = this;

    return function () {
      // TODO View creates Model instance
      var folder = new Folder({id : folderId});

      folder.fetch({
        success : function (err, result) {
          self.setState({open : true, folder : result});
        }
      });
    };
  },

  toggleAttachments : function (isLinked, file) {
    var cell = this.state.cell;

    return function () {
      var attachments = _.clone(cell.value);

      if (isLinked) {
        _.remove(attachments, function (attachment) {
          return file.uuid === attachment.uuid;
        });
      } else {
        attachments.push(file);
      }

      Dispatcher.trigger(cell.changeCellEvent, {newValue : attachments, fetch : true});
    };
  },

  openOverlay : function (cell) {
    if (cell.column.kind !== "attachment") {
      console.error("Couldn't open AttachmentOverlay for this column type.");
      return;
    }

    this.setState({
      cell : cell,
      columnName : cell.column.name
    });

    // listen for changes on this model
    this.watch(cell, {reRender : false});

    this.navigateFolder(null)();
  },

  closeOverlay : function () {
    this.stopListening();

    // refresh cell!
    this.state.cell.fetch();

    this.setState(this.getInitialState());
  },

  renderOverlay : function () {
    var self = this;

    // render back button
    var backButton = null;
    if (this.state.folder.name !== "root") {
      backButton = <li key={this.state.folder.id} onClick={self.navigateFolder(this.state.folder.parent)}>...</li>
    }

    //check for empty obj or map fails
    var listItems = null;
    if (this.state.open && this.state.folder) {
      // TODO works but isn't nice
      document.getElementsByTagName("body")[0].style.overflow = "hidden";

      listItems = (
        <div>
          <ul style={{marginBottom: "30px"}}>
            {backButton}

            {this.state.folder.subfolders.map(function (subfolder) {
              return <li key={subfolder.id} onClick={self.navigateFolder(subfolder.id)}><i
                className="icon fa fa-folder-open"></i> {subfolder.name}</li>
            })}
          </ul>
          <ul>
            {this.state.folder.files.map(function (file) {

              var currentCellValue = self.state.cell.value;

              var linked = _.find(currentCellValue, function (linkedFile) {
                return file.uuid === linkedFile.uuid;
              });

              var isLinked = linked ? true : false;

              return <li key={file.uuid} className={isLinked ? 'isLinked' : ''}
                         onClick={self.toggleAttachments(isLinked, file)}><i
                className="icon fa fa-file"></i> {file.name}</li>
            })}
          </ul>
        </div>
      );
    } else {
      document.getElementsByTagName("body")[0].style.overflow = "auto";
    }

    return (
      <div id="overlay" className={this.state.open ? "open" : "closed"} ref="overlay">
        <div id="overlay-wrapper">
          <h2>{(this.state.columnName ? this.state.columnName : '') + " – " + (this.state.folder ? this.state.folder.name : '')}</h2>

          <div className="content-scroll">
            <div id="overlay-content">
              {listItems}
            </div>
          </div>
        </div>
        <div onClick={this.closeOverlay} className="background"></div>
      </div>
    );
  },

  render : function () {
    return this.renderOverlay();
  }

});

module.exports = MediaOverlay;
