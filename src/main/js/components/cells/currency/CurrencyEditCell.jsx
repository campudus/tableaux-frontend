import React from 'react';
import _ from  'lodash';
import OverlayHeadRowIdentificator from '../../overlay/OverlayHeadRowIdentificator.jsx';
import ActionCreator from'../../../actions/ActionCreator';
import CurrencyRow from './CurrencyRow';
import listensToClickOutside from 'react-onclickoutside/decorator';
import {getCurrencyWithCountry} from './currencyHelper';

@listensToClickOutside()
export default class CurrencyEditCell extends React.Component {

  static propTypes = {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    currencies : React.PropTypes.object.isRequired,
    setCellKeyboardShortcuts : React.PropTypes.func
  };

  componentDidMount() {
    this.props.setCellKeyboardShortcuts({

      always : (event) => {
        event.stopPropagation();
      },

      enter : (event) => {
        //stop handling the Table events
        //event.stopPropagation();
        event.preventDefault();
      },
      tab : (event) => {
        //event.stopPropagation();
      },
      escape : (event) => {
        this.saveAndExit();
      }
    });
  }

  componentWillUnmount() {
    console.log("CurrencyCell will unmount, save changes");

    //Important to clean up the keyboard shortcuts
    this.props.setCellKeyboardShortcuts({});
  }

  saveAndExit() {
    ActionCreator.toggleCellEditing(false);
  }

  handleClickOutside = (event) => {
    this.saveAndExit();
  };


  render() {
    const {cell,currencies,langtag} = this.props;
    const {column} = cell;
    const {countryCodes} = column;

    console.log("currencyEditcell currencies: ", currencies, "countryCodes:", countryCodes);

    const currencyRows = countryCodes.map((countryCode, index) => {
      const currencyValue = getCurrencyWithCountry(currencies, countryCode);
      //console.log("currencyValue:", currencyValue, "countryCode:", countryCode);
      return <CurrencyRow key={index} country={countryCode} countryCurrencyValue={currencyValue}/>;
    });

    return (
      <div className="cell-currency-rows">
        {currencyRows}
      </div>
    );
  }

}
