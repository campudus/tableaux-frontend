import React from "react";
import listensToClickOutside from "react-onclickoutside";
import * as _ from "lodash/fp";
import i18n from "i18next";
import Select from "react-select";
import {either} from "../../helpers/monads";
import ActionCreator from "../../actions/ActionCreator";

@listensToClickOutside
class ColumnFilterPopup extends React.Component {

  handleClickOutside = () => {
    this.props.close();
  };

  unhide = what => {
    const coll = (_.isArray(what))
      ? what.map(_.props(["value"]))
      : [what.value];
    ActionCreator.setColumnsVisibility(true, coll);
  };

  setAll = val => () => {
    const n_columns = this.props.columns.models.length;
    ActionCreator.setColumnsVisibility(val, _.range(0, n_columns))
  };

  render = () => {
    const {colVisible, columns, langtag} = this.props;
    const n_hidden = _.filter(x => !x, colVisible).length;

    const getName = x => {
      return either(x)
        .map(_.prop(["displayName", langtag]))
        .orElse(_.prop(["name"]))
        .getOrElseThrow("Could not extract displayName or name from" + x);
    }
    const names = _.map(getName, columns.models);
    const options = names
      .map((label, idx) => {
        return {
          value: idx,
          label: label
        }
      })
      .filter( (col, idx) => !colVisible[idx])
    return (
      <div id="column-filter-popup-wrapper">
        <div className="row">
          <text>{n_hidden + " " + i18n.t("table.hidden_items")}</text>
        </div>
        <div className="row">
          <a href="#" className="button neutral"
             onClick={this.setAll(true)}
          >{i18n.t("table.show_all_columns")}</a>
          <a href="#" className="button neutral"
             onClick={this.setAll(false)}
          >{i18n.t("table.hide_all_columns")}</a>
        </div>
        <div className="row">
          <div className="Select-input">
            <Select className="unhide-column-select"
                    searchable={true}
                    clearable={false}
                    options={options}
                    onChange={this.unhide}
                    placeholder={i18n.t("table.unhide_placeholder")}
            />
          </div>
        </div>
      </div>
    )
  }
}

ColumnFilterPopup.propTypes = {
  close: React.PropTypes.func.isRequired,
  langtag: React.PropTypes.string.isRequired,
  colVisible: React.PropTypes.array.isRequired,
  columns: React.PropTypes.object.isRequired
};

export default ColumnFilterPopup;