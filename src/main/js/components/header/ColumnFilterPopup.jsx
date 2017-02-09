import React from "react";
import listensToClickOutside from "react-onclickoutside";
import * as f from "lodash/fp";
import i18n from "i18next";
import {either} from "../../helpers/monads";
import ActionCreator from "../../actions/ActionCreator";
import {List} from "react-virtualized";
import {FilterModes, Directions, FallbackLanguage} from "../../constants/TableauxConstants";
import SearchFunctions from "../../helpers/searchFunctions";
import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";
import classNames from "classnames";

@listensToClickOutside
class ColumnFilterPopup extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      models: this.props.columns.models.filter(this.buildFilter()),
      currFilter: null,
      selected: 0
    };
  }

  setFilter = (str, type = FilterModes.CONTAINS) => {
    const filter = {
      value: str,
      type: type
    };
    const {columns:{models}} = this.props;
    this.setState({
      filter: filter,
      models: models.filter(this.buildFilter(filter))
    });
  };

  // returns a true/false filter function accepting one argument
  buildFilter = filter => {
    const {columns:{models}} = this.props;
    const lvl1 = col => col != f.first(models); // ignore ID column
    const lvl2 = (filter)
      ? f.compose(SearchFunctions[filter.type](filter.value), this.getColName)
      : f.stubTrue;                                // ...or pass all
    return f.allPass([lvl1, lvl2])
  };

  handleClickOutside = event => {
    event.preventDefault();
    this.props.close(event);
  };

  setVisibilityAndUpdateGrid(val, coll) {
    ActionCreator.setColumnsVisibility(val, coll, () => this.list.forceUpdateGrid());
  };

  setAll = val => () => {
    const models = this.props.columns.models;
    const toggle_ids = f.drop(1, models).map(x => x.id); // get ids of all but first column
    this.setVisibilityAndUpdateGrid(val, toggle_ids);
  };

  getKeyboardShortcuts = () => {
    const columns = this.state.models;
    const selectNext = (dir) => {
      const {selected} = this.state;
      const nextIdx = (selected + ((dir === Directions.UP) ? -1 : 1) + columns.length) % columns.length;
      this.setState({selected: nextIdx});
    };
    return {
      enter: event => {
        this.toggleCol(columns[this.state.selected].id)(event);
      },
      escape: event => {
        event.preventDefault();
        event.stopPropagation();
        if (this.searchBar.value === "") {
          this.props.close(event);
        } else {
          this.searchBar.value = "";
          this.setFilter("");
        }
      },
      up: event => {
        event.preventDefault();
        event.stopPropagation();
        selectNext(Directions.UP);
      },
      down: event => {
        event.preventDefault();
        event.stopPropagation();
        selectNext(Directions.DOWN);
      },
    }
  };

  toggleCol = index => event => {
    event.stopPropagation();
    const {columns:{models}} = this.props;
    const the_column = f.first(f.filter(x => x.id === index, models));
    this.setVisibilityAndUpdateGrid(!the_column.visible, [index]);
    this.forceUpdate();
  };

  getColName = col => either(col)
      .map(f.prop(["displayName", this.props.langtag]))
      .orElse(f.prop(["displayName", FallbackLanguage]))
      .orElse(f.prop(["name"]))
      .getOrElseThrow("Could not extract displayName or name from" + col);

  renderCheckboxItems = ({key, index, style}) => {
    const {models} = this.state;
    const col = models[index];
    const name = this.getColName(col);

    const cssClass = classNames("column-filter-checkbox-wrapper", {
      "even": index % 2 === 0 && index !== this.state.selected,
      "odd": index % 2 === 1 && index !== this.state.selected,
      "selected": index === this.state.selected
    });

    return (
      <div className={cssClass}
           key={key}
           style={style}
           onClick={this.toggleCol(col.id)}
           onMouseEnter={() => this.setState({selected: index})}
      >
        <input type="checkbox"
               checked={col.visible}
               onChange={() => {
               }}
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
    const {columns} = this.props;
    const n_hidden = columns.filter(x => !x.visible).length;
    const {models} = this.state;

    return (
      <div id="column-filter-popup-wrapper"
           onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
      >
        <div className="row infotext header-text">
          <i className="fa fa-eye" />
          {i18n.t("table:hide_unhide")}
        </div>
        <div className="wrap-me-grey">

          <div className="filter-input row">
            <input type="text"
                   className="input"
                   placeholder={i18n.t("table:filter_columns")}
                   onChange={this.handleFilterChange}
                   ref={input => this.searchBar = input}
                   autoFocus
            />
          </div>
        </div>
        <List className="column-checkbox-list"
              ref={list => this.list = list}
              width={440}
              height={300}
              rowCount={models.length}
              rowHeight={30}
              scrollToIndex={this.state.selected}
              rowRenderer={this.renderCheckboxItems}
        />

        <div className="row infotext">
          <text>{n_hidden + " " + i18n.t("table:hidden_items")}</text>
        </div>
        <div className="wrap-me-grey">
          <div className="row">
            <a href="#" className="button positive"
               onClick={this.setAll(true)}
            >{i18n.t("table:show_all_columns")}</a>
            <a href="#" className="button neutral"
               onClick={this.setAll(false)}
            >{i18n.t("table:hide_all_columns")}</a>
          </div>
        </div>
      </div>
    )
  }
}

ColumnFilterPopup.propTypes = {
  close: React.PropTypes.func.isRequired,
  langtag: React.PropTypes.string.isRequired,
  columns: React.PropTypes.object.isRequired
};

export default ColumnFilterPopup;