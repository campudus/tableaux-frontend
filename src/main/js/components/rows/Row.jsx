import React from "react";
import TableauxConstants from "../../constants/TableauxConstants";
import ActionCreator from "../../actions/ActionCreator";
import Cell from "../cells/Cell.jsx";
import connectToAmpersand from "../helperComponents/connectToAmpersand";
import MetaCell from "../cells/MetaCell";
import {hasUserAccessToLanguage, isUserAdmin} from "../../helpers/accessManagementHelper";
import {initiateDeleteRow} from "../../helpers/rowHelper";
import * as f from "lodash/fp";
import classNames from "classnames";

@connectToAmpersand
class Row extends React.Component {

  displayName = "Row";

  constructor(props) {
    super(props);

    props.table.columns.models.forEach(
      col => props.watch(col,
        {
          event: "change",
          force: true
        })
    );

    props.watch(
      props.row,
      {
        event: "change:final,change:unlocked",
        force: true
      }
    );
  }

  // Allows a good performance when editing large tables
  shouldComponentUpdate(nextProps, nextState) {
    // Update on every available prop change
    if (this.props.langtag !== nextProps.langtag
      || this.props.row !== nextProps.row
      || this.props.isRowExpanded !== nextProps.isRowExpanded
      || this.props.cellWithOpenAnnotations !== nextProps.cellWithOpenAnnotations
    ) {
      return true;
    } else if (!this.props.isRowSelected && (nextProps.selectedCell && (this.props.row.getId() !== nextProps.selectedCell.rowId))) {
      // Don't update when I'm not selected and I will not get selected
      return false;
    } else if (!this.props.selectedCell && nextProps.selectedCell && nextProps.selectedCell.rowId === this.props.row.getId()) {
      // When nothing is selected and I get selected
      return true;
    } else {
      // When nothing is selected and I don't get expanded
      return !(!this.props.selectedCell && !nextProps.isRowExpanded);
    }
  };

  toggleExpand = () => {
    ActionCreator.disableShouldCellFocus();
    ActionCreator.toggleRowExpand(this.props.row.id);
  };

  onClickDelete = e => {
    ActionCreator.disableShouldCellFocus();
    const {row, langtag} = this.props;
    initiateDeleteRow(row, langtag);
  };

  renderSingleLanguageCell = (cell, idx) => {
    const className = "cell cell-" + cell.column.getId() + "-" + cell.rowId + " repeat";
    return <div key={idx} className={className} onContextMenu={self.contextMenuHandler}>—.—</div>;
  };

  renderCells = (langtag, isRowSelected) => {
    const {cellWithOpenAnnotations} = this.props;
    return this.props.row.cells.map((cell, idx) => {
      // Skip cells in hidden columns
      const cols = this.props.table.columns.models;
      if (cols[idx] !== f.first(cols) && !cols[idx].visible) { // keep first column always visible
        return null;
      }

      // Check selected row for expanded multilanguage rows
      const selectedRow = !!isRowSelected;
      // Is this cell currently selected
      const selected = this.props.selectedCell
        ? (cell.getId() === this.props.selectedCell.getId()) && selectedRow
        : false;
      // Is this cell in edit mode
      const editing = selected ? this.props.selectedCellEditing : false;
      // we want to pass shouldFocus just when the cell is selected or in editing mode to prevent spamming all cells
      // with props changes
      const shouldFocus = selected || editing ? this.props.shouldCellFocus : false;
      const isExpandedCell = langtag !== this.props.langtag;
      const areAnnotationsOpen = cell.id === cellWithOpenAnnotations;

      // We want to see single-language value even if not expanded
      if (!cell.isMultiLanguage && !this.props.isRowExpanded) {
        return <Cell key={idx} cell={cell} langtag={langtag} selected={selected} editing={editing}
                     shouldFocus={shouldFocus} row={this.props.row} table={this.props.table}
                     annotationsOpen={areAnnotationsOpen}
                     isExpandedCell={isExpandedCell}

        />;
      }

      // We don't want to repeat our self if expanded
      if (!cell.isMultiLanguage && this.props.isRowExpanded) {
        if (langtag === TableauxConstants.DefaultLangtag) {
          return <Cell key={idx} cell={cell} langtag={langtag} selected={selected} editing={editing}
                       shouldFocus={shouldFocus} row={this.props.row} table={this.props.table}
                       annotationsOpen={areAnnotationsOpen}
                       isExpandedCell={isExpandedCell}
          />;
        } else {
          return this.renderSingleLanguageCell(cell, idx);
        }
      }

      // If value is multi-language just render cell
      if (cell.isMultiLanguage) {
        return <Cell key={idx} cell={cell} langtag={langtag} selected={selected} editing={editing}
                     shouldFocus={shouldFocus} row={this.props.row} table={this.props.table}
                     annotationsOpen={areAnnotationsOpen}
                     isExpandedCell={isExpandedCell}
        />;
      }
    });
  };

  contextMenuHandler = e => {
    e.stopPropagation();
  };

  renderLanguageRow = langtag => {
    const {isRowSelected, selectedCellExpandedRow, row, isRowExpanded, table} = this.props;
    // Is this (multilanguage) row selected
    const selected = (isRowSelected && (langtag === selectedCellExpandedRow));
    if (selected && row.recentlyDuplicated) {
      // Todo: TBD: isn't it overkill to throw a action for this?
      // We want to visually clear the highlighting of a recently duplicated row
      row.recentlyDuplicated = false;
    }

    const className = classNames(`row row-${this.props.row.getId()}`, {
      "selected": selected,
      "duplicated": row.recentlyDuplicated,
      "final": row.final
    });

    const cantTranslate = !isUserAdmin() && (isRowSelected || isRowExpanded) && !hasUserAccessToLanguage(langtag);
    const canDeleteRow = table.type !== "settings" && (langtag === TableauxConstants.DefaultLangtag || !isRowExpanded) && isRowSelected && isUserAdmin();
    const deleteButton = (canDeleteRow && !row.final)
      ? (
        <div className="delete-row">
          <button className="button" onClick={this.onClickDelete}>
            <i className="fa fa-trash" />
          </button>
        </div>
      )
      : null;
    const rowAccessStatusIcon = (() => {
      if (cantTranslate) {
        return <i className="fa fa-ban access-denied-icon" />; // access-denied-icon defines style
      } else if (row.final) {
        return <i className={"access-denied-icon fa " + ((row.unlocked) ? "fa-unlock" : "fa-lock")} />;
      } else {
        return null;
      }
    })();

    return (
      <div key={this.props.row.getId() + "-" + langtag} className={className} tabIndex="-1"
           onContextMenu={this.contextMenuHandler}>
        {rowAccessStatusIcon}
        {deleteButton}
        <MetaCell langtag={langtag} rowId={this.props.row.getId()}
                  onClick={this.toggleExpand} rowExpanded={this.props.isRowExpanded} />
        {this.renderCells(langtag, selected)}
      </div>
    );
  };

  render = () => {
    if (this.props.isRowExpanded) {
      // render all language-rows for this row
      const rows = TableauxConstants.Langtags.map((langtag) => {
        return this.renderLanguageRow(langtag);
      });
      return <div className="row-group expanded" tabIndex="-1">{rows}</div>;
    } else {
      return this.renderLanguageRow(this.props.langtag);
    }
  }
}

Row.propTypes = {
  langtag: React.PropTypes.string.isRequired,
  table: React.PropTypes.object.isRequired,
  row: React.PropTypes.object.isRequired,
  selectedCell: React.PropTypes.object,
  selectedCellEditing: React.PropTypes.bool,
  selectedCellExpandedRow: React.PropTypes.string,
  isRowExpanded: React.PropTypes.bool.isRequired,
  isRowSelected: React.PropTypes.bool,
  shouldCellFocus: React.PropTypes.bool,
  cellWithOpenAnnotations: React.PropTypes.string
};

export default Row;
