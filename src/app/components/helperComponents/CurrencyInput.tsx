import {
  FocusEvent,
  KeyboardEvent,
  KeyboardEventHandler,
  MouseEvent,
  ReactElement,
  useEffect,
  useState
} from "react";
import ReactCurrencyInput, {
  CurrencyInputOnChangeValues,
  formatValue
} from "react-currency-input-field";
import { useDispatch } from "react-redux";
import Action from "../../redux/actionCreators";

type CurrencyInputProps = {
  className?: string;
  langtag: string;
  country: string;
  placeholder?: string;
  value?: number | null;
  onClick?: (evt: MouseEvent<HTMLInputElement>) => void;
  onBlur: (country: string, value?: number | null) => void;
  disabled?: boolean;
};

export default function CurrencyInput({
  langtag,
  country,
  placeholder = "-,-",
  value,
  onClick,
  onBlur,
  disabled
}: CurrencyInputProps): ReactElement {
  const [values, setValues] = useState<Partial<CurrencyInputOnChangeValues>>();

  const handleChange = (
    value?: string,
    country?: string,
    values?: CurrencyInputOnChangeValues
  ) => {
    setValues(values);
  };

  const handleFocus = (evt: FocusEvent<HTMLInputElement>) => {
    if (disabled) {
      // prevent focus without suppressing pointer events
      evt.target.blur();
    }
  };

  const handleBlur = () => {
    if (!disabled) {
      onBlur(country, values?.float);
    }
  };

  const toInputValues = (value?: number | null) => ({
    float: value,
    value: formatValue({
      value: value?.toString(),
      decimalScale: 2,
      disableGroupSeparators: true,
      intlConfig: { locale: langtag }
    })
  });

  useEffect(() => {
    setValues(toInputValues(value));
  }, [value]);

  const dispatch = useDispatch();
  const stopEditing = (event: KeyboardEvent<HTMLDivElement>) => {
    dispatch(Action.toggleCellEditing({ editing: false }));
    event.currentTarget?.blur();
  };
  const handleKeyPress: KeyboardEventHandler<HTMLDivElement> = event => {
    switch (event.key) {
      case "Enter":
        handleBlur();
        return stopEditing(event);
      case "Escape":
        setValues(toInputValues(value));
        return stopEditing(event);
    }
  };

  return (
    <div onKeyDown={handleKeyPress}>
      <ReactCurrencyInput
        key={country}
        name={country}
        className="currency-input"
        placeholder={placeholder}
        decimalsLimit={2}
        decimalScale={2}
        allowNegativeValue={false}
        disableAbbreviations={true}
        intlConfig={{ locale: langtag }}
        value={values?.value}
        onClick={onClick}
        onFocus={handleFocus}
        onValueChange={handleChange}
        onBlur={handleBlur}
      />
    </div>
  );
}
