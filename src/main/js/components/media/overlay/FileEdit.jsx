var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var SingleFileEdit = require('./SingleFileEdit.jsx');
var MultiFileEdit = require('./MultiFileEdit.jsx');

var FileEdit = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'FileEdit',

  propTypes : {
    file : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    onClose : React.PropTypes.func.isRequired
  },

  getInitialState : function () {
    return {
      editedTitleValue : {},
      editedDescValue : {},
      editedExternalnameValue : {},
      editedLanguage : {},
      hasChanged : false
    }
  },

  onTitleChange : function (titleValue, langtag) {
    var editedValue = this.state.editedTitleValue;
    editedValue[langtag] = titleValue;
    this.setState({
      hasChanged : true,
      editedTitleValue : editedValue
    });
  },

  onDescriptionChange : function (descriptionValue, langtag) {
    var editedValue = this.state.editedDescValue;
    editedValue[langtag] = descriptionValue;
    this.setState({
      hasChanged : true,
      editedDescValue : editedValue
    });
  },

  onExternalnameChange : function (externalnameValue, langtag) {
    var editedValue = this.state.editedExternalnameValue;
    editedValue[langtag] = externalnameValue;
    this.setState({
      hasChanged : true,
      editedExternalnameValue : editedValue
    });
  },

  onLangChange : function (newLang, langtag) {
    var editedValue = this.state.editedLanguage;
    editedValue[langtag] = newLang;
    this.setState({
      hasChanged : true,
      editedLanguage : editedValue
    });
  },

  render : function () {
    var file = this.props.file;
    var overlayBody;
    if (file.internalName && Object.keys(file.internalName).length > 1) {
      overlayBody = <MultiFileEdit file={this.props.file}
                                   langtag={this.props.langtag}
                                   onClose={this.props.onClose}
                                   editedTitleValue={this.state.editedTitleValue}
                                   editedDescValue={this.state.editedDescValue}
                                   editedExternalnameValue={this.state.editedExternalnameValue}
                                   editedLanguage={this.state.editedLanguage}
                                   hasChanged={this.state.hasChanged}
                                   onTitleChange={this.onTitleChange}
                                   onDescriptionChange={this.onDescriptionChange}
                                   onExternalnameChange={this.onExternalnameChange}
                                   onLangChange={this.onLangChange}/>;
    } else {
      overlayBody = <SingleFileEdit file={this.props.file}
                                    langtag={this.props.langtag}
                                    onClose={this.props.onClose}
                                    editedTitleValue={this.state.editedTitleValue}
                                    editedDescValue={this.state.editedDescValue}
                                    editedExternalnameValue={this.state.editedExternalnameValue}
                                    hasChanged={this.state.hasChanged}
                                    onTitleChange={this.onTitleChange}
                                    onDescriptionChange={this.onDescriptionChange}
                                    onExternalnameChange={this.onExternalnameChange}/>;
    }

    return overlayBody;
  }
});

module.exports = FileEdit;
