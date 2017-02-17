import React from "react";
import connectToAmpersand from "../../HOCs/connectToAmpersand";
import SingleFileEdit from "./SingleFileEdit";
import MultiFileEdit from "./MultiFileEdit.jsx";
import {translate} from "react-i18next";

@translate(["media"])
@connectToAmpersand
class FileEdit extends React.Component {

  static propTypes = {
    file : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    onClose : React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      editedTitleValue : {},
      editedDescValue : {},
      editedExternalnameValue : {},
      editedLanguage : {},
      hasChanged : false
    };
  }

  onTitleChange = (titleValue, langtag) => {
    let editedValue = this.state.editedTitleValue;
    editedValue[langtag] = titleValue;
    this.setState({
      hasChanged : true,
      editedTitleValue : editedValue
    });
  };

  onDescriptionChange = (descriptionValue, langtag) => {
    let editedValue = this.state.editedDescValue;
    editedValue[langtag] = descriptionValue;
    this.setState({
      hasChanged : true,
      editedDescValue : editedValue
    });
  };

  onExternalnameChange = (externalnameValue, langtag) => {
    let editedValue = this.state.editedExternalnameValue;
    editedValue[langtag] = externalnameValue;
    this.setState({
      hasChanged : true,
      editedExternalnameValue : editedValue
    });
  };

  onLangChange = (newLang, langtag) => {
    let editedValue = this.state.editedLanguage;
    editedValue[langtag] = newLang;
    this.setState({
      hasChanged : true,
      editedLanguage : editedValue
    });
  };

  render() {
    const file = this.props.file;
    let overlayBody;
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
}

module.exports = FileEdit;
