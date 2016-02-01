var React = require('react');
var App = require('ampersand-app');
var MultifileFileEdit = require('./MultifileFileEdit.jsx');
var ampersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var _ = require('lodash');

var MultiFileEdit = React.createClass({

  mixins : [ampersandMixin],

  propTypes : {
    file : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    onClose : React.PropTypes.func.isRequired
  },

  componentWillMount : function () {
    this.hasChanged = false;
  },

  getInitialState : function () {
    return {
      edited_title : {},
      edited_description : {},
      edited_externalName : {},
      edited_language : {}
    };
  },

  onSave : function (event) {
    event.preventDefault();
    var self = this;
    if (this.hasChanged) {
      var foundLangs = [];
      var langDuplicates = [];
      App.langtags.forEach(function (langtag) {
        var lang = self.state.edited_language[langtag] ? self.state.edited_language[langtag] : langtag;
        if (_.includes(foundLangs, lang)) {
          langDuplicates.push(lang);
        } else {
          foundLangs.push(lang);
        }
      });

      if (langDuplicates.length > 0) {
        alert("Jede Sprache darf nur einmal vorkommen. Sprache(n): " + langDuplicates.join(',') + " sind mehrfach gesetzt. Bitte prüfen und jede Sprache nur einmal setzen.");
        return;
      } else {
        var file = this.props.file;
        _.merge(file.title, this.state.edited_title);
        _.merge(file.description, this.state.edited_description);
        _.merge(file.externalName, this.state.edited_externalName);

        var changedFile = {
          title : {},
          description : {},
          externalName : {},
          internalName : {},
          mimeType : {}
        };
        for (var langToSwap  in this.state.edited_language) {
          if (this.state.edited_language.hasOwnProperty(langToSwap)) {
            var langToSwapTo = this.state.edited_language[langToSwap];
            changedFile.title[langToSwapTo] = file.title[langToSwap] || null;
            changedFile.description[langToSwapTo] = file.description[langToSwap] || null;
            changedFile.externalName[langToSwapTo] = file.externalName[langToSwap] || null;
            changedFile.internalName[langToSwapTo] = file.internalName[langToSwap] || null;
            changedFile.mimeType[langToSwapTo] = file.mimeType[langToSwap] || null;
          }
        }

        _.merge(file.title, changedFile.title);
        _.merge(file.description, changedFile.description);
        _.merge(file.externalName, changedFile.externalName);
        _.merge(file.internalName, changedFile.internalName);
        _.merge(file.mimeType, changedFile.mimeType);

        Dispatcher.trigger('change-file', file.toJSON());
      }
    }
    this.props.onClose(event);
  },

  onClose : function (event) {
    if (this.hasChanged) {
      if (confirm('Sind Sie sicher? Ungespeicherte Daten gehen verloren.')) {
        this.props.onClose(event)
      }
    } else {
      this.props.onClose(event)
    }
  },

  onChange : function (langtag, key, value) {
    if (key == 'language') {
      var editedValue = this.state['edited_language'];
      editedValue[langtag] = value;
      this.setState({
        edited_language : editedValue
      });
      this.hasChanged = true;
    } else {
      var internalKey = 'edited_' + key;
      var editedValue = this.state[internalKey];
      editedValue[langtag] = value;
      var stateObj = {};
      stateObj[internalKey] = editedValue;
      this.setState(stateObj);
      this.hasChanged = true;
    }
  },

  render : function () {
    var self = this;
    var files = App.langtags.map(function (langtag) {
      var fileData = {
        title : self.state.edited_title[langtag] ? self.state.edited_title[langtag] : self.props.file.title[langtag],
        description : self.state.edited_description[langtag] ? self.state.edited_description[langtag] : self.props.file.description[langtag],
        externalName : self.state.edited_externalName[langtag] ? self.state.edited_externalName[langtag] : self.props.file.externalName[langtag],
        internalName : self.props.file.internalName[langtag],
        uuid : self.props.file.uuid
      };
      var language = self.state.edited_language[langtag] ? self.state.edited_language[langtag] : langtag;
      return (
        <MultifileFileEdit key={langtag}
                           originalLangtag={langtag}
                           langtag={language}
                           fileData={fileData}
                           onChange={self.onChange}/>
      );
    });

    return (
      <div className="multifile-edit">
        <div className="multifile-file-edit-wrapper">
          {files}
          <div className="clearfix"></div>
        </div>
        <div className="button-wrapper">
          <button className="button" onClick={this.onSave}>Save</button>
          <button className="button" onClick={this.onClose}>Cancel</button>
        </div>
      </div>
    );
  }
});

module.exports = MultiFileEdit;