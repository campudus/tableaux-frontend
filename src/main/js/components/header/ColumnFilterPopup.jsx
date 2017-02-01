import React from "react";
import listensToClickOutside from "react-onclickoutside";
import * as _ from "lodash/fp";
import i18n from "i18next";
import Select from "react-select";
import {either} from "../../helpers/monads";
import ActionCreator from "../../actions/ActionCreator";
import {List} from "react-virtualized";
import {FilterModes} from "../../constants/TableauxConstants";
import SearchFunctions from "../../helpers/searchFunctions";

@listensToClickOutside
class ColumnFilterPopup extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      models: this.props.columns.models.filter(this.buildFilter()),
      currFilter: null
    };
  }

  setFilter = (str, type = FilterModes.CONTAINS) => {
    const filter = {value: str, type: type};
    const {columns:{models}} = this.props;
    this.setState({
      filter: filter,
      models: models.filter(this.buildFilter(filter))
    });
  };

  // returns a true/false filter function accepting one argument
  buildFilter = filter => {
    const {columns:{models}} = this.props;
    const lvl1 = col => col != _.first(models); // ignore ID column
    const lvl2 = (filter)
      ? _.compose( SearchFunctions[filter.type](filter.value), this.getColName )
      : _.stubTrue;                                // ...or pass all
    return _.allPass([lvl1, lvl2])
  };

  handleClickOutside = () => {
    this.props.close();
  };

  setVisibilityAndUpdateGrid(val, coll) {
    ActionCreator.setColumnsVisibility(val, coll, () => this.list.forceUpdateGrid());
  };

  setAll = val => () => {
    const models = this.props.columns.models;
    const toggle_ids = _.drop(1, models).map(x => x.id); // get ids of all but first column
    this.setVisibilityAndUpdateGrid(val, toggle_ids);
  };

  toggleCol = index => event => {
    event.stopPropagation();
    const {columns:{models}} = this.props;
    const the_column = _.first(_.filter(x => x.id === index, models));
    this.setVisibilityAndUpdateGrid(!the_column.visible, [index]);
  };

  getColName = col => either(col)
      .map(_.prop(["displayName", this.props.langtag]))
      .orElse(_.prop(["name"]))
      .getOrElseThrow("Could not extract displayName or name from" + col);


  renderCheckboxItems = ({key, index, style}) => {
    const {colVisible, langtag} = this.props;
    const {models} = this.state;
    const col = models[index];
    const name = this.getColName(col);

    return (
      <div className={"column-filter-checkbox-wrapper" + ((index % 2 === 0) ? " even" : " odd")}
           key={key}
           style={style}
           onClick={this.toggleCol(col.id)}>
        <input type="checkbox"
               checked={col.visible}
               onChange={() => {}}
        />
        {name}
      </div>
    )
  };

  handleFilterChange = event => {
    event.stopPropagation();
    event.preventDefault();
    const value = event.target.value;
    this.setFilter(value);
  };

  render = () => {
    const {columns, langtag} = this.props;
    const n_hidden = columns.filter(x => !x.visible).length;
    const {models} = this.state;

    const getName = x => {
      return either(x)
        .map(_.prop(["displayName", langtag]))
        .orElse(_.prop(["name"]))
        .getOrElseThrow("Could not extract displayName or name from" + x);
    };

    return (
      <div id="column-filter-popup-wrapper">
        <List className="column-checkbox-list"
              ref={list => this.list = list}
              width={440}
              height={300}
              rowCount={models.length}
              rowHeight={30}
              rowRenderer={this.renderCheckboxItems}
        />

        <div>
          <input type="text"
                 className="input"
                 placeholder={i18n.t("table:filter_columns")}
                 onChange={this.handleFilterChange}
          />
        </div>

        <div className="row">
          <text>{n_hidden + " " + i18n.t("table:hidden_items")}</text>
        </div>
        <div className="row">
          <a href="#" className="button positive"
             onClick={this.setAll(true)}
          >{i18n.t("table:show_all_columns")}</a>
          <a href="#" className="button neutral"
             onClick={this.setAll(false)}
          >{i18n.t("table:hide_all_columns")}</a>
        </div>

      </div>
    )
  }
}

ColumnFilterPopup.propTypes = {
  close: React.PropTypes.func.isRequired,
  langtag: React.PropTypes.string.isRequired,
  columns: React.PropTypes.object.isRequired,
};

export default ColumnFilterPopup;