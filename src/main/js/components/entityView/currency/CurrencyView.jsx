import React from 'react';
import {getCurrencyWithCountry} from '../../cells/currency/currencyHelper';
import {getCountryOfLangtag, getCurrencyCode, getLanguageOrCountryIcon} from '../../../helpers/multiLanguage';

const CurrencyView = React.createClass({

  displayName : 'CurrencyView',

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    cell : React.PropTypes.object.isRequired,
  },

  getCurrencyValues : function (cell, showAll) {
    const {column} = cell;
    const {countryCodes} = column;

    return countryCodes.map((countryCode, index) => {
      const currencyValues = cell.value;
      const currencyValue = getCurrencyWithCountry(currencyValues, countryCode);
      const currencyCode = getCurrencyCode(countryCode);

      if (showAll || currencyValue) {
        return <div key={index} className="currency-item">{getLanguageOrCountryIcon(countryCode)} {currencyValue || "--"} {currencyCode}</div>
      } else {
        return null;
      }
    }).filter(Boolean);
  },

  render : function () {
    const {cell} = this.props;
    var currencyRows = this.getCurrencyValues(cell, false);

    return (
      <div className='view-content currency'>
        {currencyRows}
      </div>
    );
  }
});

export default CurrencyView;