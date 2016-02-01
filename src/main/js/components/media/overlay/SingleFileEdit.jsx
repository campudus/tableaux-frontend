var React = require('react');
var App = require('ampersand-app');
var ampersandMixin = require('ampersand-react-mixin');
var Dropzone = require('react-dropzone');
var request = require('superagent');

var multiLanguage = require('../../../helpers/multiLanguage');
var SingleFileTextInput = require('./SingleFileTextInput.jsx');
var FileChangeUpload = require('./FileChangeUpload.jsx');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var apiUrl = require('../../../helpers/apiUrl');
var LanguageSwitcher = require('../../header/LanguageSwitcher.jsx');

var SingleFileEdit = React.createClass({

  mixins : [ampersandMixin],

  propTypes : {
    file : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    onClose : React.PropTypes.func.isRequired
  },

  getInitialState : function () {
    return {
      isTitleOpen : false,
      isDescriptionOpen : false,
      isExternalnameOpen : false,
      editedTitleValue : {},
      editedDescValue : {},
      editedExternalnameValue : {},
      hasChanged : false,
      multifileLanguage : App.langtags[1]
    }
  },

  onSave : function (event) {
    event.preventDefault();
    if (this.state.hasChanged) {
      var file = this.props.file;
      file.title = this.state.editedTitleValue;
      file.description = this.state.editedDescValue;
      file.externalName = this.state.editedExternalnameValue;

      Dispatcher.trigger('change-file', file.toJSON());
    }
    this.props.onClose(event)
  },

  onClose : function (event) {
    if (this.state.hasChanged) {
      if (confirm('Sind Sie sicher? Ungespeicherte Daten gehen verloren.')) {
        this.props.onClose(event)
      }
    } else {
      this.props.onClose(event)
    }
  },

  onTitleChange : function (titleValue, langtag) {
    var editedValue = this.state.editedTitleValue;
    editedValue[langtag] = titleValue;
    this.setState({
      editedTitleValue : editedValue,
      hasChanged : true
    });
  },

  toggleTitle : function () {
    this.setState({
      isTitleOpen : !this.state.isTitleOpen
    });
  },

  onDescChange : function (descValue, langtag) {
    var editedValue = this.state.editedDescValue;
    editedValue[langtag] = descValue;
    this.setState({
      editedDescValue : editedValue,
      hasChanged : true
    });
  },

  toggleDesc : function () {
    this.setState({
      isDescriptionOpen : !this.state.isDescriptionOpen
    });
  },

  onExternalnameChange : function (externalnameValue, langtag) {
    var editedValue = this.state.editedExternalnameValue;
    editedValue[langtag] = externalnameValue;
    this.setState({
      editedExternalnameValue : editedValue,
      hasChanged : true
    });
  },

  toggleExternalname : function () {
    this.setState({
      isExternalnameOpen : !this.state.isExternalnameOpen
    });
  },

  onMultifileLanguageChange : function (lang) {
    this.setState({
      multifileLanguage : lang
    });
  },

  onMultilangDrop : function (files) {
    var self = this;
    var langtag = this.state.multifileLanguage;

    files.forEach(function (file) {
      // upload each file for it's own

      var uuid = self.props.file.uuid;

      var uploadUrl = apiUrl("/files/" + uuid + "/" + langtag);

      request.put(uploadUrl)
        .attach("file", file, file.name)
        .end(self.multilangUploadCallback);
    });
  },

  multilangUploadCallback : function (err, uploadRes) {
    if (err) {
      console.error("FileDelete.uploadCallback", err);
      return;
    }

    if (uploadRes) {
      var result = uploadRes.body;
      result.fileUrl = result.url;
      delete result.url;

      Dispatcher.trigger('changed-file-data', result);
    }
  },

  renderTextInput : function (id, label, valueObj, langtag, isOpen) {
    var self = this;
    var retrieveTranslation = multiLanguage.retrieveTranslation(App.langtags[0]);

    if (isOpen) {
      return (App.langtags.map(function (langtag) {
        var value = retrieveTranslation(valueObj, langtag);
        return self.renderField(id, value, langtag);
      }));
    } else {
      var value = retrieveTranslation(valueObj, langtag);
      return (
        <div className='field-item'>
          <label htmlFor={id} className="field-label">{label}</label>
          {this.renderField(id, value, langtag)}
        </div>
      );
    }
  },

  render : function () {
    var langOptions = App.langtags.reduce(function (res, langtag) {
      if (App.langtags[0] !== langtag) {
        res.push({
          value : langtag,
          label : langtag
        });
      }
      return res;
    }, []);

    var fileLangtag = Object.keys(this.props.file.internalName)[0];
    var fileInternalName = this.props.file.internalName[fileLangtag];

    var language = App.langtags[0].split(/-|_/)[0];
    var country = App.langtags[0].split(/-|_/)[1];
    var icon = country.toLowerCase() + ".png";

    return (
      <div className="singlefile-edit">
        <div className="input-wrapper">
          <div className="cover-wrapper">
            <div className="cover">
              <FileChangeUpload
                langtag={fileLangtag}
                internalFileName={fileInternalName}
                uuid={this.props.file.uuid}/>
            </div>
          </div>
          <div className="properties-wrapper">
            <SingleFileTextInput name="fileTitle"
                                 labelText="Titel"
                                 originalValue={this.props.file.title}
                                 editedValue={this.state.editedTitleValue}
                                 langtag={this.props.langtag}
                                 isOpen={this.state.isTitleOpen}
                                 onToggle={this.toggleTitle}
                                 onChange={this.onTitleChange}/>

            <SingleFileTextInput name="fileDescription"
                                 labelText="Beschreibung"
                                 originalValue={this.props.file.description}
                                 editedValue={this.state.editedDescValue}
                                 langtag={this.props.langtag}
                                 isOpen={this.state.isDescriptionOpen}
                                 onToggle={this.toggleDesc}
                                 onChange={this.onDescChange}/>

            <SingleFileTextInput name="fileLinkName"
                                 labelText="Linkname"
                                 originalValue={this.props.file.externalName}
                                 editedValue={this.state.editedExternalnameValue}
                                 langtag={this.props.langtag}
                                 isOpen={this.state.isExternalnameOpen}
                                 onToggle={this.toggleExternalname}
                                 onChange={this.onExternalnameChange}/>
          </div>

          <div className="multifile-wrapper">
            <Dropzone onDrop={this.onMultilangDrop} className="dropzone" multiple={false}>
              <span>Falls es für diese Datei Übersetzungen in anderen Sprachen gibt, kann hier eine übersetzte Version hochgeladen werden.
                Die Datei wird dann automatisch in eine mehrsprachige Datei umgewandelt.
                Dies bedeutet, dass, neben den übersetzten Attributen, für jede Sprache eine Übersetzung der Datei hochgeladen werden kann.
                <br />
                <br />
                Die bereits vorhandene Datei wird automatisch als <img src={"/img/flags/" + icon}
                                                                       alt={country}/> {language.toUpperCase()} markiert. Dies kann später wieder verändert werden.
                <br />
                <br />
                Übersetzte Datei hierher ziehen oder hier klicken, um übersetzte Datei hochzuladen.
              </span>
            </Dropzone>
            <LanguageSwitcher
              options={langOptions}
              openOnTop
              onChange={this.onMultifileLanguageChange}
              langtag={this.state.multifileLanguage}/>
          </div>
        </div>
        <div className="button-wrapper">
          <button className="button" onClick={this.onSave}>Save</button>
          <button className="button" onClick={this.onClose}>Cancel</button>
        </div>
      </div>
    );
  }
});

module.exports = SingleFileEdit;