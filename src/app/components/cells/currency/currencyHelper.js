import f from "lodash/fp";
import { getFallbackCurrencyValue } from "../../../helpers/multiLanguage";

export function getCurrencyWithCountry(
  currencyObj,
  country,
  withFallback = false
) {
  const result = f.getOr(null, country, currencyObj);
  const fallBack = getFallbackCurrencyValue({ country }, currencyObj) || null;
  return withFallback ? result || fallBack : result;
}

export function splitPriceDecimals(priceValue) {
  if (!f.isFinite(priceValue)) {
    return ["0", "00"];
  }
  let priceValueAsArray = String(priceValue).split(".");

  return priceValueAsArray.length === 1
    ? [...priceValueAsArray, "00"]
    : priceValueAsArray;
}
