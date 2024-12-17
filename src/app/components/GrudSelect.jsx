import React from "react";
import Select from "react-select";
import f from "lodash/fp";
import { unless } from "../helpers/functools";

/**
 * @param disabled boolean optional
 * @param className string optional
 * @param options Array<Option>
 * @param searchable boolean optional
 * @param clearable boolean optional
 * @param value Option | Option['value']
 * @param onChange Option -> ()
 * @param placeholder string optional
 */

export default props => {
  const handleChange = value => {
    console.log("change value:", value);
    props.onChange(value);
  };

  const value = unless(
    f.anyPass([f.isNil, f.isPlainObject]),
    v => props.options.find(vv => vv.value === v) ?? { value: v, label: v }
  )(props.value);

  console.log("value", props.value, "->", value);
  return (
    <Select
      {...props}
      menuPortalTarget={document.body}
      menuPosition="fixed"
      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
      onChange={handleChange}
      value={value}
    />
  );
};
