/* eslint-disable @typescript-eslint/no-explicit-any */
import f from "lodash/fp";
import { ReactElement } from "react";
import i18n from "i18next";
import {
  autoUpdate,
  useFloating,
  autoPlacement,
  offset
} from "@floating-ui/react-dom";
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
  const { refs, floatingStyles } = useFloating({
    placement: "top-start",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset({
        mainAxis: -22.5,
        crossAxis: 0,
        alignmentAxis: 0
      }),
      autoPlacement({
        alignment: "start",
        allowedPlacements: ["top-start", "bottom-start"],
        padding: 10
      })
    ]
  });
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
    <>
      <div
        ref={refs.setReference}
        style={editing ? { alignSelf: "center" } : {}}
      />
      <div
        ref={refs.setFloating}
        style={editing ? floatingStyles : {}}
        className="cell-content"
      >
        {countries.map(country => {
          const canEdit = canUserChangeCountryTypeCell(cell)(country);
          const value = (cell.value as any)[country];
          const currencyCode = getCurrencyCode(country);

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
                placeholder={
                  f.isNil(currencyCode)
                    ? i18n.t("table:error_language_is_no_country")
                    : undefined
                }
                value={value}
                onBlur={handleBlur}
                disabled={!editing || !canEdit}
              />

              <div className="currency-code">{getCurrencyCode(country)}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
