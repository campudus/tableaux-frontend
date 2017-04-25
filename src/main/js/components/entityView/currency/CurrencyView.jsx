import React, {Component, PropTypes} from "react";
import CurrencyItem from "./CurrencyItem";
import * as f from "lodash/fp";
import {changeCell} from "../../../models/Tables";

class CurrencyView extends Component {

  constructor(props) {
    super(props);
    const {countryCodes} = props.cell.column;
    this.state = {editing: f.range(0, countryCodes.length).map(f.stubFalse)};
  };

  static propTypes = {
    langtag: React.PropTypes.string.isRequired,
    cell: React.PropTypes.object.isRequired,
    funcs: React.PropTypes.object.isRequired,
    thisUserCantEdit: React.PropTypes.bool
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
                           isDisabled={this.props.thisUserCantEdit}
      />;
    });
  };

  setEditing = (el) => (to, [country, value] = []) => {
    const {editing} = this.state;
    const {cell} = this.props;
    const isEditing = (to === true)
      ? f.assoc(el, true, f.map(f.stubFalse, editing))
      : f.set(el, false, editing);
    if (country && value) {
      const changes = {[country]: value};
      changeCell({cell, value: changes});
    }
    if (editing[el] !== to) {
      this.setState({editing: isEditing});
    }
  };

  render() {
    const {cell, funcs} = this.props;
    const currencyRows = this.getCurrencyValues(cell, false);

    return (
        <div className="item-content currency"
             ref={el => { funcs.register(el) }}
             tabIndex={1}
        >
        {currencyRows}
      </div>
    );
  }
}

export default CurrencyView;
