import React, {Component, PropTypes} from "react";
import multiLanguage from "../../../helpers/multiLanguage";
import _ from "lodash";
import {isUserAdmin, getUserLanguageAccess, hasUserAccessToLanguage} from "../../../helpers/accessManagementHelper";
import {getLanguageOrCountryIcon} from "../../../helpers/multiLanguage";
import {translate} from "react-i18next";
import {Langtags, DefaultLangtag} from "../../../constants/TableauxConstants";

class SingleFileTextInput extends Component {

  static propTypes = {
    name: PropTypes.string.isRequired,
    labelText: PropTypes.string.isRequired,
    langtag: PropTypes.string.isRequired,
    originalValue: PropTypes.object.isRequired,
    editedValue: PropTypes.object.isRequired,
    isOpen: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired
  };

  generateId = (name, langtag) => {
    return name + "_" + langtag;
  };

  renderInput = (name, valueObj, langtag) => {
    const {isOpen} = this.props;
    const retrieveTranslation = multiLanguage.retrieveTranslation(DefaultLangtag);

    return Langtags
      .filter(lt => isOpen || lt === langtag)
      .map(
        (lt) => this.renderField(
          this.generateId(name, lt),
          retrieveTranslation(valueObj, lt),
          lt
        )
      )
  };

  onChange = (langtag, event) => {
    const changedVal = event.target.value;
    this.props.onChange(changedVal, langtag);
  };

  renderField = (id, value, langtag) => {
    // disable input for users without access to that language
    const disabled = !hasUserAccessToLanguage(langtag);

    return (
      <div className="item">
        <div className="item-content" key={id}>
          <div onClick={this.onToggle}>{this.renderLangtag(langtag)}</div>
          <input disabled={disabled} type="text" ref={id} id={id} value={value}
                 onChange={this.onChange.bind(this, langtag)}/>
        </div>
      </div>);
  };

  renderLangtag = (langtag) => {
    return getLanguageOrCountryIcon(langtag);
  };

  onToggle = () => {
    var valueObj = {};
    Langtags.map((langtag) => {
      var id = this.generateId(this.props.name, langtag);
      if (this.refs[id]) {
        valueObj[langtag] = this.refs[id].value;
      }
    });
    this.props.onToggle(valueObj);
  };

  render() {
    function generateValue(originalValue, editedValue) {
      return _.merge({}, originalValue, editedValue);
    }

    var labelText = this.props.labelText;
    var langtag = this.props.langtag;
    var value = generateValue(this.props.originalValue, this.props.editedValue);
    var id = this.generateId(this.props.name, langtag);
    return (
      <div className="item-contents">
        <div  className="item-header">{labelText}</div>
        {this.renderInput(this.props.name, value, langtag)}
      </div>
    );
  }
}

module.exports = translate(["media"])(SingleFileTextInput);
