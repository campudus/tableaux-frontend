/* eslint-disable @typescript-eslint/no-explicit-any */
import f from "lodash/fp";
import { ReactElement } from "react";
import { useDispatch } from "react-redux";
import actions from "../../../redux/actionCreators";
import { Cell, Country, CurrencyColumn } from "../../../types/grud";
import {
  getCountryOfLangtag,
  getCurrencyCode,
  getLanguageOrCountryIcon
} from "../../../helpers/multiLanguage";
import CurrencyInput from "../../helperComponents/CurrencyInput";
import { canUserChangeCountryTypeCell } from "../../../helpers/accessManagementHelper";

type CurrencyCellProps = {
  cell: Cell;
  editing: boolean;
  selected: boolean;
  langtag: string;
};

export default function CurrencyCell({
  cell,
  editing,
  langtag
}: CurrencyCellProps): ReactElement {
  const dispatch = useDispatch();
  const column = cell.column as CurrencyColumn;
  const country = getCountryOfLangtag(langtag) as Country;
  const countries = editing ? column.countryCodes : [country];

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
    <div className="cell-content">
      {countries.map(country => {
        const canEdit = canUserChangeCountryTypeCell(cell)(country);
        const value = (cell.value as any)[country];

        return (
          <div
            key={country}
            className={f
              .compact(["currency-item", f.isNil(value) && "grey-out"])
              .join(" ")}
          >
            {editing && (
              <div className="country-code">
                {getLanguageOrCountryIcon(country)}
              </div>
            )}

            <CurrencyInput
              key={country}
              langtag={langtag}
              country={country}
              value={value}
              onBlur={handleBlur}
              disabled={!editing || !canEdit}
            />

            <div className="currency-code">{getCurrencyCode(country)}</div>
          </div>
        );
      })}
    </div>
  );
}
