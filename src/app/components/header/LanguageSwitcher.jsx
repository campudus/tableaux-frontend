import f from "lodash/fp";
import Select from "react-select";
import React, { useCallback } from "react";
import PropTypes from "prop-types";

import { Langtags } from "./../../constants/TableauxConstants";
import { getLanguageOrCountryIcon } from "../../helpers/multiLanguage";

const Option = props => {
  const { value, selectOption, getValue } = props;
  const handleClick = useCallback(() => selectOption(value));
  const selectedValue = getValue() |> f.head |> f.prop("value");
  return (
    <button className="language-switcher__item" onMouseDown={handleClick}>
      {getLanguageOrCountryIcon(value || selectedValue, "language")}
    </button>
  );
};

// const DropdownIndicator = () => <i className="fa fa-arrow-down" />;
const IndicatorSeparator = () => null;
const DropdownIndicator = () => <i className="fa fa-sort-down" />; // TODO: change to fa-sort-down after FA-upgrade

const LanguageSwitcher = props => {
  const { limitLanguages, disabled, langtag, onChange, openOnTop } = props;

  const handleChange = useCallback(option => {
    if (f.isFunction(onChange)) {
      onChange(option);
    }
  });

  const languages = f.isNil(props.languages) ? Langtags : props.languages;
  // Inside select box show user just the languages he has access to
  const languagesToDisplay =
    !disabled && limitLanguages ? limitLanguages : languages;

  const mkOption = optionLangtag => ({
    value: optionLangtag,
    label: optionLangtag
  });

  const options =
    props.options ||
    languagesToDisplay.filter(f.complement(f.equals(langtag))).map(mkOption);

  const selectedOption = mkOption(langtag);

  return (
    <div className="language-switcher">
      <Select
        className={
          "language-switcher__main" + (openOnTop ? " open-on-top" : "")
        }
        classNamePrefix="language-switcher"
        options={options}
        isSearchable={false}
        isClearable={false}
        value={langtag && selectedOption}
        onChange={handleChange}
        disabled={disabled}
        components={{ Option, SingleValue: Option, IndicatorSeparator }}
      />
    </div>
  );
};

LanguageSwitcher.propTypes = {
  limitLanguages: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool,
  langtag: PropTypes.string,
  onChange: PropTypes.func,
  openOnTop: PropTypes.bool
};

export default LanguageSwitcher;
