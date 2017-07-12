const f = require("lodash/fp");

const currencyCodeMap = {
  DE: "EUR",
  FR: "EUR",
  US: "USD",
  GB: "GBP",
  IT: "EUR",
  PL: "PLN",
  NL: "EUR",
  ES: "EUR",
  AT: "EUR",
  CH: "SFR",
  CZ: "CZK",
  DK: "DKK"
};

const reverseCurrencyCodeMap = f.keys(currencyCodeMap).reduce(
  (aggregator, country) => {
    const key = currencyCodeMap[country];
    if (!aggregator[key]) {
      aggregator[key] = [country];
      return aggregator;
    } else {
      aggregator[key].push(country);
      return aggregator;
    }
  },
  {}
);

console.log(reverseCurrencyCodeMap);
