import React from 'react';
import {getCountryOfLangtag, getCurrencyCode, getLanguageOrCountryIcon} from '../../../helpers/multiLanguage';
import {splitPriceDecimals} from './currencyHelper';

export default class CurrencyRow extends React.Component {

  static propTypes = {
    country : React.PropTypes.string.isRequired,
    countryCurrencyValue : React.PropTypes.number
  };

  constructor(props) {
    super(props);
  }

  onChangeInteger(e) {
    var currentVal = e.target.value;
  }

  onChangeDecimals(e) {

  }

  renderCurrencyValue(value) {
    const splittedValue = splitPriceDecimals(value);

    return (
      <div>
        <input className="currency-input integer" type="text" defaultValue={splittedValue[0]}
               onChange={this.onChangeInteger}/>
        <span className="delimiter">,</span>
        <input className="currency-input decimals" type="text" defaultValue={splittedValue[1]}
               onChange={this.onChangeDecimals}/>
      </div>
    );
  }


  render() {
    const {country, countryCurrencyValue} = this.props;
    const currencyCode = getCurrencyCode(country);
    let currencyValue = this.renderCurrencyValue(countryCurrencyValue);

    return (
      <div className="currency-row">
        <div className="country-code">{getLanguageOrCountryIcon(country)}</div>
        <div className="currency-value">{currencyValue}</div>
        <div className="currency-code">{currencyCode}</div>
      </div>
    );
  }

}