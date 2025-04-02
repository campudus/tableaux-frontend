import { CSSProperties, ReactElement } from "react";
import ReactSelect, {
  ActionMeta as _ActionMeta,
  DropdownIndicatorProps,
  GroupBase,
  OnChangeValue,
  Props as SelectProps
} from "react-select";
import f from "lodash/fp";
import { unless } from "pragmatic-fp-ts";

// upgrade prettier to v2 for support of new ts syntax
// export type { ActionMeta };
export type ActionMeta<Option> = _ActionMeta<Option>;

export type SelectOption = {
  label: string;
  value: string | number;
};

export default function Select<
  Option extends SelectOption,
  IsMulti extends boolean,
  Group extends GroupBase<Option>
>(
  props: Omit<SelectProps<Option, IsMulti, Group>, "onChange" | "options"> & {
    disabled?: boolean;
    // overwrite as required
    options: Option[]; // only support options, not groups
    onChange: (
      value: OnChangeValue<Option, IsMulti>,
      actionMeta: ActionMeta<Option>
    ) => void;
  }
): ReactElement {
  const handleChange = (
    value: OnChangeValue<Option, IsMulti>,
    actionMeta: ActionMeta<Option>
  ) => {
    props.onChange(value, actionMeta);
  };

  const value = unless(
    f.anyPass([f.isNil, f.isPlainObject]),
    v => props.options.find(vv => vv.value === v) || { value: v, label: v }
  )(props.value);

  return (
    <ReactSelect
      {...props}
      isDisabled={props.isDisabled || props.disabled}
      classNamePrefix={"react-select"}
      menuPortalTarget={document.body}
      menuPosition="fixed"
      styles={{
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
        dropdownIndicator: base => ({ ...base, padding: "5px 6px 6px 3px" }),
        menuList: base => ({ ...base, padding: 0 })
      }}
      onChange={handleChange}
      value={value}
      components={{
        IndicatorSeparator: null,
        DropdownIndicator,
        ...props.components
      }}
    />
  );
}

function DropdownIndicator<
  Option extends SelectOption,
  IsMulti extends boolean,
  Group extends GroupBase<Option>
>(props: DropdownIndicatorProps<Option, IsMulti, Group>): ReactElement {
  const isOpen = props.selectProps.menuIsOpen;
  const className = `fa fa-${isOpen ? "caret-up" : "caret-down"}`;

  return (
    <div style={props.getStyles("dropdownIndicator", props) as CSSProperties}>
      <i style={{ fontSize: "1.3em" }} className={className} />
    </div>
  );
}
