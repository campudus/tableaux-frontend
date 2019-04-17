import React from "react";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

const SearchBar = props => {
  const { onChange, placeholder, debounce, icon } = props;
  const value = props.value || "";

  const onChangeAsHandler = event => onChange(event.target.value);

  const handleChange = f.isNumber(debounce)
    ? f.debounce(debounce, onChangeAsHandler)
    : onChangeAsHandler;

  const clearOnEscape = event => {
    if (f.propEq("key", "Escape")(event)) {
      event.stopPropagation();
      onChange("");
    }
  };

  return (
    <div className="search-bar-wrapper">
      <div className="search-bar">
        <input
          className="search-bar__input"
          value={value}
          onChange={handleChange}
          placeholder={i18n.t(placeholder || "")}
          onKeyDown={clearOnEscape}
        />
        <div className="search-bar__icon">{icon}</div>
      </div>
    </div>
  );
};

export default SearchBar;

SearchBar.propTypes = {
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  debounce: PropTypes.number,
  icon: PropTypes.element
};
