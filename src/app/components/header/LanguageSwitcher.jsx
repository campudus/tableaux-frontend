import f from "lodash/fp";
import Select from "react-select";
import React from "react";
import PropTypes from "prop-types";
import { compose, withHandlers, pure, setPropTypes } from "recompose";

import { Langtags } from "./../../constants/TableauxConstants";
import { getLanguageOrCountryIcon } from "../../helpers/multiLanguage";

const enhance = compose(
  setPropTypes({
    langtag: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    openOnTop: PropTypes.bool,
    options: PropTypes.array,
    disabled: PropTypes.bool,
    limitLanguages: PropTypes.array
  }),
  withHandlers({
    onChange: props => langObj => {
      // prevents undefined language tag: we just want to switch the language when there is actually something selected
      // if (!f.isEmpty(langObj)) {
      const langtag = langObj.value;
      if (props.onChange) {
        props.onChange(langtag);
      }
      // }
    },
    renderOption: () => option =>
      getLanguageOrCountryIcon(option.value, "language")
  }),
  pure
);

const LanguageSwitcher = props => {
  const {
    limitLanguages,
    disabled,
    langtag,
    onChange,
    renderOption,
    openOnTop
  } = props;
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

  return (
    <div className="language-switcher">
      <Select
        className={openOnTop ? "open-on-top" : ""}
        options={options}
        searchable={false}
        clearable={false}
        value={langtag}
        onChange={onChange}
        optionRenderer={renderOption}
        valueRenderer={renderOption}
        disabled={disabled}
      />
    </div>
  );
};

export default enhance(LanguageSwitcher);
