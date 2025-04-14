import React, { PureComponent } from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { Directions } from "../../../constants/TableauxConstants";
import { connectOverlayToCellValue } from "../../helperComponents/connectOverlayToCellHOC";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import { unless } from "../../../helpers/functools";
import { unlockRow } from "../../../helpers/annotationHelper";
import FilterBar from "./FilterBar";
import Header from "../../overlay/Header";
import HeaderPopupMenu from "./HeaderPopupMenu";
import HistoryButtons from "../../table/undo/HistoryButtons";
import OverlayHeaderLanguageSwitcher from "../OverlayHeaderLanguageSwitcher";

class RowSwitcher extends PureComponent {
  static propTypes = {
    rows: PropTypes.array,
    row: PropTypes.object.isRequired,
    id: PropTypes.number.isRequired,
    langtag: PropTypes.string.isRequired
  };

  changeEntityViewRow = row => {
    const { id, actions } = this.props;
    actions.setOverlayState({ id, row });
  };

  getNextRow = dir => {
    const { row, rows } = this.props;
    const myRowIdx = f.findIndex(f.matchesProperty("id", row.id), rows);
    const dirAsNumber = dir === Directions.UP ? -1 : 1;
    return f.get([myRowIdx + dirAsNumber], rows);
  };

  switchRow = dir => () => {
    const nextRow = this.getNextRow(dir);
    if (nextRow) {
      unlockRow({}, false);
      this.props.updateSharedData(f.assoc("row", nextRow));
      this.changeEntityViewRow(nextRow);
    }
  };

  render() {
    return (
      <div className="row-switcher">
        {this.getNextRow(Directions.UP) ? (
          <button
            className="button clickable"
            onClick={this.switchRow(Directions.UP)}
          >
            <i className="fa fa-angle-left" />
          </button>
        ) : (
          <div className="button dummy" />
        )}
        {this.getNextRow(Directions.DOWN) ? (
          <button
            className="button clickable"
            onClick={this.switchRow(Directions.DOWN)}
          >
            <i className="fa fa-angle-right" />
          </button>
        ) : (
          <div className="button dummy" />
        )}
      </div>
    );
  }
}

const EntityViewHeader = props => {
  const {
    id,
    actions,
    canSwitchRows,
    hasMeaningfulLinks,
    sharedData,
    sharedData: { contentLanguage, setContentLanguage },
    langtag,
    row,
    rows,
    grudData,
    cell
  } = props;
  const tableId = f.prop(["table", "id"], cell);
  const table = f.prop(["tables", "data", tableId], grudData);
  const { tableView } = grudData;

  const getLanguage = () => {
    const result = contentLanguage || langtag;
    return result;
  };

  const components = (
    <div className="header-components">
      <OverlayHeaderLanguageSwitcher
        key={getLanguage()}
        contentLangtag={getLanguage()}
        handleChange={lt => {
          setContentLanguage({ langtag: lt });
        }}
        classes="eev-language-switcher"
      />
      {canSwitchRows && !f.isEmpty(rows) ? <RowSwitcher {...props} /> : null}
      <HistoryButtons
        tableView={tableView}
        tableId={tableId}
        rowId={row.id}
        actions={actions}
      />
      <FilterBar id={id} />
      <HeaderPopupMenu
        tableView={tableView}
        langtag={langtag}
        id={id}
        funcs={sharedData}
        hasMeaningfulLinks={hasMeaningfulLinks}
      />
    </div>
  );

  const tableName = f.isEmpty(table.displayName)
    ? table.name
    : retrieveTranslation(langtag, table.displayName) || table.name;

  const idColumn = f.prop(["columns", tableId, "data", 0], grudData);

  const titleCell = {
    ...cell,
    value: f.first(row.values),
    column: idColumn,
    row
  };

  return (
    <Header
      {...props}
      cell={titleCell}
      context={tableName}
      components={components}
    />
  );
};

EntityViewHeader.propTypes = {
  canSwitchRows: PropTypes.bool,
  hasMeaningfulLinks: PropTypes.any,
  row: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired
};

const getDisplayLabel = (row, langtag) => {
  const firstCell = f.prop(["values", 0], row);
  return unless(
    f.isEmpty,
    retrieveTranslation(langtag)
  )(f.prop("displayValue", firstCell));
};

export { getDisplayLabel };
export default connectOverlayToCellValue(EntityViewHeader);
