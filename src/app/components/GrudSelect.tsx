import { CSSProperties, ReactElement } from "react";
import ReactSelect, {
  ActionMeta as RSActionMeta,
  components,
  ControlProps,
  DropdownIndicatorProps,
  OptionProps,
  Theme,
  GroupBase,
  OnChangeValue,
  Props as SelectProps
} from "react-select";
import f from "lodash/fp";
import { unless } from "pragmatic-fp-ts";

export type ActionMeta<T> = RSActionMeta<T>;

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
    // react-select hands it on to the custom components as selectProps.testId
    testId: string;
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
      theme={(theme): Theme => ({
        ...theme,
        colors: {
          ...theme.colors,
          danger: "#d86357",
          dangerLight: "#d86357cc",
          primary: "#3296dc",
          primary25: "#3296dc40",
          primary50: "#3296dc80",
          primary75: "#3296dcBF"
        }
      })}
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
        Control: ControlWithTestId,
        Option: OptionWithTestId,
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

const testIdOf = (selectProps: unknown) =>
  (selectProps as { testId: string }).testId;

// the control is the click target that opens the menu, its input covers the value
function ControlWithTestId<
  Option extends SelectOption,
  IsMulti extends boolean,
  Group extends GroupBase<Option>
>(props: ControlProps<Option, IsMulti, Group>): ReactElement {
  const innerProps = {
    ...props.innerProps,
    "data-testid": testIdOf(props.selectProps)
  };
  return <components.Control {...props} innerProps={innerProps} />;
}

function OptionWithTestId<
  Option extends SelectOption,
  IsMulti extends boolean,
  Group extends GroupBase<Option>
>(props: OptionProps<Option, IsMulti, Group>): ReactElement {
  const innerProps = {
    ...props.innerProps,
    "data-testid": `${testIdOf(props.selectProps)}-option-${props.data.value}`
  };
  return <components.Option {...props} innerProps={innerProps} />;
}
