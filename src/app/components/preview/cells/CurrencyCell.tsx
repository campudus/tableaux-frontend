import { CurrencyColumn } from "../../../types/grud";
import { ReactElement } from "react";
import { getEmptyClassName } from "../helper";
import { formatNumber, getCurrencyCode } from "../../../helpers/multiLanguage";
import i18n from "i18next";

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
      {column.countryCodes.map(countryCode => {
        const value = values[countryCode];
        const currencyCode = getCurrencyCode(countryCode);
        const formattedNumber = formatNumber(value, 3, langtag);

        return (
          <span key={countryCode} className="currency-cell__item">
            <span style={{ width: "25px" }}>{countryCode}:&nbsp;</span>
            <span className={getEmptyClassName(formattedNumber)}>
              {formattedNumber
                ? `${formattedNumber} ${currencyCode}`
                : i18n.t("preview:empty")}
            </span>
          </span>
        );
      })}
    </div>
  );
}
