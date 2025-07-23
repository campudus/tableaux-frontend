import { CurrencyColumn } from "../../../types/grud";
import { ReactElement } from "react";
import { setEmptyClassName } from "../helper";
import { getCurrencyCode } from "../../../helpers/multiLanguage";

type CurrencyCellProps = {
  langtag: string;
  column: CurrencyColumn;
  values: Record<string, number>;
};

export default function CurrencyCell({
  langtag,
  column,
  values
}: CurrencyCellProps): ReactElement {
  return (
    <div className="currency-cell">
      {column.countryCodes.map((countryCode, index) => {
        const value = values[countryCode];
        const currencyCode = getCurrencyCode(countryCode);
        const formattedValue =
          value !== undefined
            ? new Intl.NumberFormat(langtag, {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }).format(value)
            : undefined;

        return (
          <span key={countryCode} className="currency-cell__item">
            <span style={{ width: "25px" }}>{countryCode}:&nbsp;</span>
            <span className={setEmptyClassName(formattedValue)}>
              {formattedValue ? `${formattedValue} ${currencyCode}` : "Leer"}
            </span>

            {/* {column.countryCodes.length > 1 &&
              index < column.countryCodes.length - 1 && (
                <span className="currency-cell__separator">&bull;</span>
              )} */}
          </span>
        );
      })}
    </div>
  );
}
