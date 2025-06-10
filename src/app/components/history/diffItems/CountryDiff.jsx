import classNames from "classnames";
import f from "lodash/fp";
import React from "react";
import { doto, ifElse } from "../../../helpers/functools";
import {
  getCurrencyCode,
  getLanguageOrCountryIcon
} from "../../../helpers/multiLanguage";
import { buildClassName } from "../../../helpers/buildClassName";
import { formatNumber } from "@grud/devtools/intl";

const Changes = props => {
  const { diff, noCurrency, langtag } = props;

  const countries = f.groupBy("country", diff);
  return (
    <>
      <div className="country-diff">
        {doto(
          countries,
          f.keys,
          f.map(country => (
            <div key={country} className="country-diff-group">
              <div className="country-diff__sub-header">
                {getLanguageOrCountryIcon(country)}
                <div className="country-diff-sub-header__currency">
                  {noCurrency ? null : `[${getCurrencyCode(country)}]`}
                </div>
                {countries[country].map(({ add, del, value }, idx) => {
                  const cssClass = classNames("content-diff", {
                    "content-diff--added": add,
                    "content-diff--deleted": del
                  });
                  return (
                    <div key={idx} className={cssClass}>
                      {ifElse(
                        f.isNil,
                        () => "",
                        () => formatNumber(langtag, value),
                        value
                      )}
                    </div>
                  );
                }, countries)}
              </div>
            </div>
          ))
        )}
      </div>
      <span className="toggle-indicator__wrapper">
        <i className="toggle-indicator fa fa-angle-right" />
      </span>
    </>
  );
};

const CountryDiff = props => {
  return props.idx === 0 ? (
    <CurrentValue {...props} />
  ) : (
    <details>
      <summary>
        <Changes {...props} />
      </summary>
      <CurrentValue {...props} />
    </details>
  );
};

const CurrentValue = ({ langtag, cell, revision, diff }) => {
  const countryCodes = cell.column.countryCodes;
  const changes = f.indexBy("country", diff);
  const value = revision.fullValue;
  return (
    <div className="country-diff__full-value">
      {countryCodes.map(cc => {
        const contentClass = buildClassName("content-diff", {
          added: changes[cc]?.add,
          deleted: changes[cc]?.deleted
        });
        const ccValue = f.isNil(value[cc])
          ? "-,-"
          : formatNumber(
              langtag,
              f.isString(value[cc]) ? parseFloat(value[cc]) : value[cc]
            );

        return (
          <div key={cc} className="country-diff__value-item">
            <div className="value-item__country">
              {getLanguageOrCountryIcon(cc)}
            </div>
            <div className="value-item__content">
              <span className={contentClass}>{ccValue}</span>
            </div>
            <div className="value-item__currency">{getCurrencyCode(cc)}</div>
          </div>
        );
      })}
    </div>
  );
};

export default CountryDiff;
