var React = require('react');
var App = require('ampersand-app');
var multiLanguage = require('../../helpers/multiLanguage');
var SingleFileTextInput = require('./SingleFileTextInput.jsx');
var FileChangeUpload = require('./FileChangeUpload.jsx');
var Dispatcher = require('../../dispatcher/Dispatcher');
var ampersandMixin = require('ampersand-react-mixin');
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
      hasChanged : false
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
    return (
      <div className="singlefile-edit">
        <div className="input-wrapper">
          <div className="left">
            <div className="cover">
              <FileChangeUpload langtag="zxx_ZXX" internalFileName={this.props.file.internalName.zxx_ZXX}
                                uuid={this.props.file.uuid}/>
            </div>
          </div>
          <div className="right">
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