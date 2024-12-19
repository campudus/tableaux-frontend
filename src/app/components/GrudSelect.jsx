import React from "react";
import Select from "react-select";
import f from "lodash/fp";
import { unless } from "../helpers/functools";

export default props => {
  const handleChange = value => {
    props.onChange(value);
  };

  const value = unless(
    f.anyPass([f.isNil, f.isPlainObject]),
    v => props.options.find(vv => vv.value === v) ?? { value: v, label: v }
  )(props.value);

  return (
    <Select
      {...props}
      isDisabled={props.isDisabled || props.disabled}
      classNamePrefix={"react-select"}
      menuPortalTarget={document.body}
      menuPosition="fixed"
      styles={styling}
      onChange={handleChange}
      value={value}
      components={{
        IndicatorSeparator: null,
        DropdownIndicator,
        ...props.components
      }}
    />
  );
};

const styling = {
  menuPortal: base => ({ ...base, zIndex: 9999 }),
  control: base => {
    return {
      ...base,
      height: "30px",
      minHeight: "30px",
      borderColor: "#dedede",
      boxShadow: "none"
    };
  },
  valueContainer: base => ({ ...base, padding: "0 0 2px 4px" }),
  menu: base => ({ ...base, margin: 0 }),
  dropdownIndicator: base => ({ ...base, padding: "3px 6px 6px 3px" }),
  menuList: base => ({ ...base, padding: 0 })
};

const DropdownIndicator = props => {
  const isOpen = props.selectProps.menuIsOpen;
  const className = `fa fa-${isOpen ? "caret-up" : "caret-down"}`;
  return (
    <div style={props.getStyles("dropdownIndicator", props)}>
      <i style={{ fontSize: "1.3em" }} className={className} />
    </div>
  );
};
