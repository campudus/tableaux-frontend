/* eslint-disable @typescript-eslint/no-explicit-any */
import f from "lodash/fp";
import { MouseEvent, PropsWithChildren, ReactElement } from "react";
import { useDispatch } from "react-redux";
import { isLocked } from "../../../helpers/rowUnlock";
import actions from "../../../redux/actionCreators";
import CurrencyInput from "../../helperComponents/CurrencyInput";
import { Cell, CurrencyColumn } from "../../../types/grud";
import {
  getCurrencyCode,
  getLanguageOrCountryIcon
} from "../../../helpers/multiLanguage";

type CurrencyViewProps = PropsWithChildren<{
  langtag: string;
  cell: Cell;
  funcs: any;
  thisUserCantEdit: boolean;
}>;

export default function CurrencyView({
  langtag,
  cell,
  thisUserCantEdit,
  funcs,
  children
}: CurrencyViewProps): ReactElement {
  const dispatch = useDispatch();
  const column = cell.column as CurrencyColumn;
  const disabled = thisUserCantEdit || isLocked(cell.row);

  const handleClick = (evt: MouseEvent<HTMLInputElement>) => {
    // allow select in entityView
    if (!disabled) {
      evt.stopPropagation();
    }
  };

  const handleBlur = (country: string, value?: number | null) => {
    dispatch(
      actions.changeCellValue({
        cell,
        oldValue: cell.value,
        newValue: {
          ...cell.value,
          [country]: value
        }
      })
    );
  };

  return (
    <div>
      <div
        className="item-content currency"
        ref={el => funcs.register?.(el)}
        tabIndex={1}
      >
        {column.countryCodes.map(country => {
          const value = (cell.value as any)[country];

          return (
            <div
              key={country}
              className={[
                "currency-item",
                f.isNil(value) ? "grey-out" : ""
              ].join(" ")}
            >
              <div className="country-code">
                {getLanguageOrCountryIcon(country)}
              </div>

              <CurrencyInput
                key={country}
                langtag={langtag}
                country={country}
                value={value}
                onClick={handleClick}
                onBlur={handleBlur}
                disabled={disabled}
              />

              <div className="currency-code">{getCurrencyCode(country)}</div>
            </div>
          );
        })}
      </div>
      {children}
    </div>
  );
}
