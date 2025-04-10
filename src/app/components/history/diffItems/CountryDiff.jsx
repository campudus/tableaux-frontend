import React from "react";
import f from "lodash/fp";

import classNames from "classnames";

import { doto, unless } from "../../../helpers/functools";
import {
  getCurrencyCode,
  getLanguageOrCountryIcon
} from "../../../helpers/multiLanguage";

const CountryDiff = props => {
  const { diff, noCurrency } = props;
  const countries = f.groupBy("country", diff);
  return doto(
    countries,
    f.keys,
    f.map(country => (
      <div key={country} className="country-diff-group">
        <div className="country-diff__sub-header">
          {getLanguageOrCountryIcon(country)}
          {noCurrency ? null : (
            <div className="country-diff-sub-header__currency">{`[${getCurrencyCode(
              country
            )}]`}</div>
          )}
        </div>
        <div className="country-diff__group">
          {countries[country].map(({ add, del, value }, idx) => {
            const cssClass = classNames("content-diff", {
              "content-diff--added": add,
              "content-diff--deleted": del
            });
            return (
              <div key={idx} className={cssClass}>
                {unless(f.isNumber, () => "", value)}
              </div>
            );
          }, countries)}
        </div>
      </div>
    ))
  );
};

export default CountryDiff;
