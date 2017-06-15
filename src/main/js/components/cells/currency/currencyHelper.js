import _ from "lodash";

export function getCurrencyWithCountry(currencyObj, country) {
  // console.log("inside getCurrency:", currencyObj, country);
  return currencyObj[country] || null;
}

export function splitPriceDecimals(priceValue) {
  if (!_.isFinite(priceValue)) {
    return ["0", "00"];
  }
  let priceValueAsArray = String(priceValue).split(".");
  priceValueAsArray.length === 1 ? priceValueAsArray.push("00") : null;
  return priceValueAsArray;
}
