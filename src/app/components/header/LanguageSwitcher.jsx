import f from "lodash/fp";
import PropTypes from "prop-types";
import React, { useCallback } from "react";
import Select from "../GrudSelect";
import { getLanguageOrCountryIcon } from "../../helpers/multiLanguage";
import { Langtags } from "./../../constants/TableauxConstants";

const LanguageSwitcher = props => {
  const { disabled, langtag, limitLanguages, onChange, openOnTop } = props;
  const languages = f.isNil(props.languages) ? Langtags : props.languages;
  // Inside select box show user just the languages he has access to
  const languagesToDisplay =
    !disabled && limitLanguages ? limitLanguages : languages;

  const options =
    props.options ||
    languagesToDisplay.map(langtag => ({
      value: langtag,
      label: langtag
    }));

  const handleChange = useCallback(
    langObj => {
      const newLangtag = langObj?.value;
      if (onChange && newLangtag) {
        onChange(newLangtag);
      }
    },
    [onChange]
  );

  return (
    <div className="language-switcher">
      <Select
        className={openOnTop ? "open-on-top" : ""}
        options={options}
        searchable={false}
        clearable={false}
        value={langtag}
        onChange={handleChange}
        components={{ Option, SingleValue }}
        Disabled={disabled}
      />
    </div>
  );
};

const renderFlagAndText = key => props => {
  return (
    <span
      onClick={() => props.selectOption(props.data)}
      style={props.getStyles(key, props)}
    >
      {getLanguageOrCountryIcon(props.data.value, "language")}
    </span>
  );
};
const Option = renderFlagAndText("option");
const SingleValue = renderFlagAndText("singleValue");

LanguageSwitcher.propTypes = {
  langtag: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  openOnTop: PropTypes.bool,
  options: PropTypes.array,
  disabled: PropTypes.bool,
  limitLanguages: PropTypes.array
};

export default LanguageSwitcher;
