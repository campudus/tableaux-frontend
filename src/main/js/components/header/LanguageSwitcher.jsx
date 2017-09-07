import f from "lodash/fp";
import Select from "react-select";
import React from "react";

import TableauxConstants from "./../../constants/TableauxConstants";
import {getLanguageOrCountryIcon} from "../../helpers/multiLanguage";

const LanguageSwitcher = React.createClass({

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
    if (!f.isEmpty(langObj)) {
      const langtag = langObj.value;
      if (this.props.onChange) {
        this.props.onChange(langtag);
      }
    }
  },

  renderOption: function (option) {
    return getLanguageOrCountryIcon(option.value, "language");
  },

  render: function () {
    const {limitLanguages, disabled} = this.props;
    // Inside select box show user just the languages he has access to
    const languagesToDisplay = !disabled && limitLanguages ? limitLanguages : TableauxConstants.Langtags;

    const options = this.props.options
      || languagesToDisplay.reduce(
        function (res, langtag) {
          res.push({
            value: langtag,
            label: langtag
          });
          return res;
        },
        []
      );

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

export default LanguageSwitcher;
