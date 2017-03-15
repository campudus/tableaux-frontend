var React = require("react");
var App = require("ampersand-app");
var Select = require("react-select");
var _ = require("lodash");
import TableauxConstants from "./../../constants/TableauxConstants";
import {getLanguageOrCountryIcon} from "../../helpers/multiLanguage";

var LanguageSwitcher = React.createClass({

  propTypes: {
    langtag: React.PropTypes.string.isRequired,
    onChange: React.PropTypes.func,
    openOnTop: React.PropTypes.bool,
    options: React.PropTypes.array,
    disabled: React.PropTypes.bool,
    limitLanguages: React.PropTypes.array
  },

  onChange: function (langObj) {
    // prevents undefined language tag: we just want to switch the language when there is actually something selected
    if (!_.isEmpty(langObj)) {
      var langtag = langObj.value;
      if (this.props.onChange) {
        this.props.onChange(langtag);
      }
    }
  },

  renderOption: function (option) {
    return getLanguageOrCountryIcon(option.value);
  },

  render: function () {
    const {limitLanguages, disabled} = this.props;
    // Inside select box show user just the languages he has access to
    const languagesToDisplay = !disabled && limitLanguages ? limitLanguages : TableauxConstants.Langtags;

    var options = this.props.options || languagesToDisplay.reduce(function (res, langtag) {
      res.push({
        value: langtag,
        label: langtag
      });
      return res;
    }, []);

    return (
      <div className="language-switcher">
        <Select className={this.props.openOnTop ? "open-on-top" : ""}
                options={options}
                searchable
                clearable={false}
                value={this.props.langtag}
                onChange={this.onChange}
                optionRenderer={this.renderOption}
                valueRenderer={this.renderOption}
                disabled={this.props.disabled}
        />
      </div>
    );
  }
});

module.exports = LanguageSwitcher;
