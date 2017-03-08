import React, {Component, PropTypes} from "react";
import CurrencyItem from "./CurrencyItem";
import * as f from "lodash/fp";

class CurrencyView extends Component {

  constructor(props) {
    super(props);
    this.displayName = "CurrencyView";
    const {countryCodes} = props.cell.column;
    this.state = {editing: f.range(0,countryCodes.length).map(f.stubFalse)};
  };

  static propTypes = {
    langtag: React.PropTypes.string.isRequired,
    cell: React.PropTypes.object.isRequired
  };

  getCurrencyValues = (cell) => {
    const {column} = cell;
    const {countryCodes} = column;
    const {editing} = this.state;

    return countryCodes.map((countryCode, index) => {
      return <CurrencyItem key={index}
                           cell={cell}
                           countryCode={countryCode}
                           editing={editing[index]}
                           toggleEdit={this.setEditing(index)}
      />
    });
  };

  setEditing = (el) => (to, [country, value] = []) => {
    const {editing} = this.state;
    const isEditing = (to === true)
      ? f.assoc(el, true, f.map(f.stubFalse, editing))
      : f.set(el, false, editing);
    if (country && value) {
      const changes = {value: {[country]: value}};
      this.props.cell.save(changes, {patch: true});
    }
    if (editing[el] !== to) {
      this.setState({editing: isEditing});
    }
  };

  render() {
    const {cell, tabIdx} = this.props;
    const currencyRows = this.getCurrencyValues(cell, false);

    return (
        <div className="view-content currency" tabIndex={tabIdx}>
        {currencyRows}
      </div>
    );
  }
}

export default CurrencyView;
