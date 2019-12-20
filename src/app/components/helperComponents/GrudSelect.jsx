import React, { useCallback } from "react";
import Select from "react-select";
import f from "lodash/fp";
import { css } from "emotion";

import PropTypes from "prop-types";

// copies of values from "variables.scss", as parcel can't import scss :export objects
const colors = {
  primary: "#3296DC",
  hoverFg: "#3296DC",
  hoverBg: "#E7F1F8",
  lightGrey: "#C4C4C4",
  mediumGrey: "#999999",
  disabledBg: "#FAFAFA",
  disabledFg: "#999999"
};

const Nothing = () => null;

const Option = props => {
  const { value, selectOption, getValue, getStyles, cx, label } = props;
  const className = cx(
    "grud-select__item",
    css(getStyles("option", props), {
      "option--is-disabled": props.isDisabled,
      "option--is-focused": props.isFocused,
      "option--is-selected": props.isSelected
    })
  );
  const handleClick = useCallback(() => selectOption(value));
  const selectedValue = getValue() |> f.head |> f.prop("value");
  return (
    <button className={className} onMouseDown={handleClick}>
      {label || selectedValue}
    </button>
  );
};

const grudBaseStyle = {
  control: (provided, state = {}) => {
    const borderRadius = state.menuIsOpen ? "3px 3px 0 0" : 3;
    return {
      ...provided,
      boxShadow: "none",
      borderRadius,
      minHeight: 0,
      height: 28,
      cursor: "pointer",
      alignItems: "center",
      borderColor: state.menuIsOpen ? colors.primary : colors.lightGrey
    };
  },
  option: (provided, state = {}) => {
    return {
      ...provided,
      width: "100%",
      padding: "3px 5px",
      color: state.isDisabled ? colors.disabledFg : colors.primaryText,
      backgroundColor: state.isDisabled ? colors.disabledBg : "transparent",
      ":hover": {
        ...provided[":hover"],
        backgroundColor: state.isDisabled ? colors.disabledBg : colors.hoverBg,
        color: state.isDisabled ? colors.disabledFg : colors.hoverFg
      },
      cursor: state.isDisabled ? "inherit" : "pointer"
    };
  },
  menu: provided => {
    return { ...provided, margin: 0, borderRadius: "0 0 3px 3px" };
  },
  dropdownIndicator: provided => ({ ...provided, padding: 4 })
};

const stringToOption = stringOrOption =>
  f.isString(stringOrOption)
    ? {
        value: stringOrOption,
        label: stringOrOption
      }
    : stringOrOption;

// Wraps `react-select`, so we can replace it in the future without adapting each usage
const GrudSelect = ({
  options = [],
  value,
  onChange,
  OptionComponent = Option,
  SelectedOptionComponent,
  searchable = false,
  clearable = false,
  disabled = false,
  className = "grud-select-wrapper",
  classNamePrefix = "grud-select",
  placeholder,
  mkOption = stringToOption,
  components = {}
}) => {
  const handleChange = useCallback(option => {
    console.log("changed to", option);
    if (f.isFunction(onChange)) {
      onChange(option);
    }
  });

  const menuOptions = options |> f.reject(f.equals(value)) |> f.map(mkOption);
  const selectedOption = mkOption(value);

  console.log({ menuOptions, selectedOption });

  return (
    <Select
      styles={grudBaseStyle}
      placeholder={placeholder}
      className={className}
      classNamePrefix={classNamePrefix}
      options={menuOptions}
      value={value ? selectedOption : {}}
      onChange={handleChange}
      isDisabled={disabled}
      isClearable={clearable}
      isSearchable={searchable}
      isMulti={false}
      components={{
        Option: OptionComponent,
        SingleValue: SelectedOptionComponent || OptionComponent,
        IndicatorSeparator: Nothing,
        GroupLabel: Nothing,
        ...components
      }}
    />
  );
};

export default GrudSelect;

GrudSelect.propTypes = {
  options: PropTypes.array,
  onChange: PropTypes.func,
  OptionComponent: PropTypes.func,
  SelectedOptionComponent: PropTypes.func,
  searchable: PropTypes.bool,
  clearable: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  placeHolder: PropTypes.string,
  mkOption: PropTypes.func,
  components: PropTypes.object // Overwrite react-select components
};
