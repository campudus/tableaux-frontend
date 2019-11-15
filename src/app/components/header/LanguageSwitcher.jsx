import f from "lodash/fp";
import React, { useCallback } from "react";
import PropTypes from "prop-types";

import { Langtags } from "./../../constants/TableauxConstants";
import { getLanguageOrCountryIcon } from "../../helpers/multiLanguage";
import GrudSelect from "../helperComponents/GrudSelect";

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

  const options = languagesToDisplay.filter(f.complement(f.equals(langtag)));

  const selectedOption = langtag;

  return (
    <div className="language-switcher">
      <GrudSelect
        className={
          "language-switcher__main" + (openOnTop ? " open-on-top" : "")
        }
        classNamePrefix="language-switcher"
        options={options}
        value={selectedOption}
        onChange={handleChange}
        OptionComponent={Option}
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
