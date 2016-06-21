var React = require('react');
var App = require('ampersand-app');
var multiLanguage = require('../../../helpers/multiLanguage');
var _ = require('lodash');
import {isUserAdmin, getUserLanguageAccess, hasUserAccessToLanguage} from '../../../helpers/accessManagementHelper';
import {getLanguageOrCountryIcon} from '../../../helpers/multiLanguage';
import {translate} from 'react-i18next';
import TableauxConstants from '../../../constants/TableauxConstants';

var SingleFileTextInput = React.createClass({

  propTypes : {
    name : React.PropTypes.string.isRequired,
    labelText : React.PropTypes.string.isRequired,
    langtag : React.PropTypes.string.isRequired,
    originalValue : React.PropTypes.object.isRequired,
    editedValue : React.PropTypes.object.isRequired,
    isOpen : React.PropTypes.bool.isRequired,
    onToggle : React.PropTypes.func.isRequired,
    onChange : React.PropTypes.func.isRequired
  },

  generateId : function (name, langtag) {
    return name + '_' + langtag;
  },

  renderInput : function (name, valueObj, langtag) {
    var self = this;
    var inputs;
    var fallbackLang = TableauxConstants.DefaultLangtag;
    var retrieveTranslation = multiLanguage.retrieveTranslation(fallbackLang);
    if (this.props.isOpen) {
      inputs = TableauxConstants.Langtags.map(function (langtag) {
        var value = retrieveTranslation(valueObj, langtag);
        var id = self.generateId(name, langtag);
        return self.renderField(id, value, langtag);
      });
    } else {
      var value = retrieveTranslation(valueObj, langtag);
      var id = self.generateId(name, langtag);
      inputs = self.renderField(id, value, langtag);
    }
    return inputs;
  },

  onChange : function (langtag, event) {
    var changedVal = event.target.value;
    this.props.onChange(changedVal, langtag);
  },

  renderField : function (id, value, langtag) {
    //disable input for users without access to that language
    const disabled = hasUserAccessToLanguage(langtag) ? false : true;

    return (
      <div className="field-input" key={id}>
        <input disabled={disabled} type="text" className="field-text-input" ref={id} id={id} value={value}
               onChange={this.onChange.bind(this, langtag)}/>
        <span onClick={this.onToggle}>{this.renderLangtag(langtag)}</span>
      </div>);
  },

  renderLangtag : function (langtag) {
    return getLanguageOrCountryIcon(langtag);
  },

  onToggle : function () {
    var valueObj = {};
    var self = this;
    TableauxConstants.Langtags.map(function (langtag) {
      var id = self.generateId(self.props.name, langtag);
      if (self.refs[id]) {
        valueObj[langtag] = self.refs[id].value;
      }
    });
    this.props.onToggle(valueObj);
  },

  render : function () {
    function generateValue(originalValue, editedValue) {
      return _.merge({}, originalValue, editedValue);
    }

    var labelText = this.props.labelText;
    var langtag = this.props.langtag;
    var value = generateValue(this.props.originalValue, this.props.editedValue);
    var id = this.generateId(this.props.name, langtag);
    return (
      <div className='field-item'>
        <label htmlFor={id} className="field-label">{labelText}</label>
        {this.renderInput(this.props.name, value, langtag)}
      </div>
    );
  }
});

module.exports = translate(['media'])(SingleFileTextInput);
