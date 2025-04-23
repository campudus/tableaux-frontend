import { Country, formatCurrency, formatNumber } from "@grud/devtools/intl";
import classNames from "classnames";
import * as f from "lodash/fp";
import React, { KeyboardEventHandler } from "react";
import {
  getCurrencyCode,
  getLanguageOrCountryIcon,
  getLocaleDecimalSeparator
} from "../../../helpers/multiLanguage";
import {
  getCurrencyWithCountry,
  useCurrencyInputValue
} from "../../cells/currency/currencyHelper";
import {
  Cell,
  CurrencyCellValue,
  CurrencyColumn,
  Locale
} from "../../../types/grud";

const Position = {
  pre: "pre",
  post: "post"
} as const;
type Position = typeof Position[keyof typeof Position];

type CurrencyItemProps = {
  cell: Omit<Cell, "column" | "value"> & {
    column: CurrencyColumn;
    value: CurrencyCellValue;
  };
  countryCode: Country;
  editing: boolean;
  onChange: (_: number | null) => void;
  langtag: Locale;
  isDisabled: boolean;
  setActive: () => void;
};
const CurrencyItem = ({
  cell,
  countryCode,
  editing,
  onChange,
  langtag,
  setActive,
  isDisabled
}: CurrencyItemProps) => {
  const [{ pre, post, value }, handleChange] = useCurrencyInputValue(
    (getCurrencyWithCountry as (..._: unknown[]) => number | null)(
      cell.value,
      countryCode,
      true
    )
  );

  const handleClickOutside = () => {
    onChange(value);
  };

  const filterKeyEvents = (
    place: Position
  ): KeyboardEventHandler<HTMLInputElement> => event => {
    const { key } = event;
    if (
      (event.ctrlKey || event.metaKey) &&
      f.contains(key, ["c", "v", "a", "r"])
    ) {
      // don't capture system commands
      return;
    }
    const numberKeys = f.map(f.toString, f.range(0, 10));
    if (
      !f.contains(key, [
        ...numberKeys,
        "Backspace",
        "Enter",
        "Escape",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "Tab"
      ])
    ) {
      event.preventDefault();
      return;
    }
    if (f.contains(key, ["Tab", "Enter"])) {
      if ((key === "Enter" || place === Position.pre) && event.shiftKey) {
        // don't prevent default if shift-tab in post-comma position, so focus changes to pre-comma input
        event.preventDefault();
        event.stopPropagation();
        // changeActive(Directions.DOWN)([countryCode, value]);
      } else if (
        (key === "Enter" || place === Position.post) &&
        !event.shiftKey
      ) {
        // don't prevent.. tab... pre-comma... -> ... post-comma...
        event.preventDefault();
        event.stopPropagation();
        // changeActive(Directions.UP)([countryCode, value]);
      } else {
        event.stopPropagation();
      }
    } else if (
      place === Position.post &&
      f.contains(key, numberKeys) &&
      post?.length === 2
    ) {
      // limit comma-value of currency to 2 digits
      event.preventDefault();
    } else if (f.contains(key, ["Escape", "ArrowUp", "ArrowDown"])) {
      event.preventDefault();
      event.stopPropagation();
      handleClickOutside();
    }
  };
  const handleClear = () => handleChange("", "");

  const currencyString =
    value === null
      ? `-${getLocaleDecimalSeparator(langtag)}-`
      : formatCurrency(langtag, "EUR", value).replace(
          /(^\D*)|((?<=\d)\D*$)/g,
          ""
        );
  const currencyCode = getCurrencyCode(countryCode);
  const cssClass = classNames("currency-item", {
    "not-set":
      !((cell.value as unknown) as Record<Country, number>)[countryCode] &&
      !editing,
    editing,
    disabled: isDisabled
  });
  return (
    <>
      {editing ? (
        <div className="full-screen" onClick={handleClickOutside} />
      ) : null}
      <div className={cssClass} onClick={setActive}>
        {getLanguageOrCountryIcon(countryCode)}
        <div className="value">
          {editing ? (
            <div className="currency-input ignore-react-onclickoutside">
              <input
                className="left"
                onChange={x => handleChange(x.target.value, post)}
                value={pre || ""}
                autoFocus
                onKeyDown={filterKeyEvents(Position.pre)}
                placeholder="-"
                onClick={e => e.stopPropagation()}
              />
              {getLocaleDecimalSeparator(langtag)}
              <input
                className="right"
                onChange={x => handleChange(pre, x.target.value)}
                value={post || ""}
                onKeyDown={filterKeyEvents(Position.post)}
                placeholder="-"
                onClick={e => e.stopPropagation()}
              />
              <button onClick={handleClear}>
                <i className="fa fa-trash" />
              </button>
            </div>
          ) : (
            <div className="currency-string">{currencyString}</div>
          )}
        </div>
        <div className="currency-code">{currencyCode}</div>
      </div>
    </>
  );
};

export default CurrencyItem;
