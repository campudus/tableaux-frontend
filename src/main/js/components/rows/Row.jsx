import React from "react";
import TableauxConstants from "../../constants/TableauxConstants";
import ActionCreator from "../../actions/ActionCreator";
import Cell from "../cells/Cell.jsx";
import connectToAmpersand from "../../helpers/connectToAmpersand";
import MetaCell from "../cells/MetaCell";
import {hasUserAccessToLanguage, isUserAdmin} from "../../helpers/accessManagementHelper";
import {initiateDeleteRow} from "../../helpers/rowHelper";
import * as f from "lodash/fp";

@connectToAmpersand
class Row extends React.Component {

  displayName = 'Row';

  constructor(props) {
    super(props);
    props.table.columns.models.map(
      col => props.watch(col,
        {
          event: "change",
          force: true
        })
    )
  }

  //Allows a good performance when editing large tables
  shouldComponentUpdate(nextProps, nextState) {
    //Update on every available prop change
    if (this.props.langtag != nextProps.langtag
      || this.props.row != nextProps.row
      || this.props.isRowExpanded != nextProps.isRowExpanded
    ) {
      return true;
    }
    //Don't update when I'm not selected and I will not get selected
    else if (!this.props.isRowSelected && (nextProps.selectedCell && (this.props.row.getId() !== nextProps.selectedCell.rowId))) {
      return false;
    }
    //When nothing is selected and I get selected
    else if (!this.props.selectedCell && nextProps.selectedCell && nextProps.selectedCell.rowId === this.props.row.getId()) {
      return true;
    }
    //When nothing is selected and I don't get expanded
    else if (!this.props.selectedCell && !nextProps.isRowExpanded) {
      return false;
    }
    else {
      return true;
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
    var className = 'cell cell-' + cell.column.getId() + '-' + cell.rowId + ' repeat';
    return <div key={idx} className={className} onContextMenu={self.contextMenuHandler}>—.—</div>;
  };

  renderCells = (langtag, isRowSelected) => {
    var self = this;

    return this.props.row.cells.map(function (cell, idx) {
      //Skip cells in hidden columns
      const cols = self.props.table.columns.models
      if (cols[idx] !== f.first(cols) && !cols[idx].visible) { // keep first column always visible
        return null;
      }

      //Check selected row for expanded multilanguage rows
      var selectedRow = !!isRowSelected;
      //Is this cell currently selected
      var selected = self.props.selectedCell
        ? (cell.getId() === self.props.selectedCell.getId()) && selectedRow
        : false;
      //Is this cell in edit mode
      var editing = selected ? self.props.selectedCellEditing : false;
      //we want to pass shouldFocus just when the cell is selected or in editing mode to prevent spamming all cells
      // with props changes
      var shouldFocus = selected || editing ? self.props.shouldCellFocus : false;

      // We want to see single-language value even if not expanded
      if (!cell.isMultiLanguage && !self.props.isRowExpanded) {
        return <Cell key={idx} cell={cell} langtag={langtag} selected={selected} editing={editing}
                     shouldFocus={shouldFocus} row={self.props.row} table={self.props.table} />;
      }

      // We don't want to repeat our self if expanded
      if (!cell.isMultiLanguage && self.props.isRowExpanded) {
        if (langtag === TableauxConstants.DefaultLangtag) {
          return <Cell key={idx} cell={cell} langtag={langtag} selected={selected} editing={editing}
                       shouldFocus={shouldFocus} row={self.props.row} table={self.props.table} />;
        } else {
          return self.renderSingleLanguageCell(cell, idx);
        }
      }

      // If value is multi-language just render cell
      if (cell.isMultiLanguage) {
        return <Cell key={idx} cell={cell} langtag={langtag} selected={selected} editing={editing}
                     shouldFocus={shouldFocus} row={self.props.row} table={self.props.table} />;
      }
    })
  };

  contextMenuHandler = e => {
    e.stopPropagation();
  };

  renderLanguageRow = langtag => {
    const {isRowSelected, selectedCellExpandedRow, row, isRowExpanded, table} = this.props;

    let deleteButton, rowLockedIcon = "";

    //Is this (multilanguage) row selected
    const selected = (isRowSelected && (langtag === selectedCellExpandedRow));
    if (selected && row.recentlyDuplicated) {
      //Todo: TBD: isn't it overkill to throw a action for this?
      //We want to visually clear the highlighting of a recently duplicated row
      row.recentlyDuplicated = false;
    }

    //Set row class optional with selected class
    const className = 'row row-' + this.props.row.getId() + (selected ? " selected" : "") + (row.recentlyDuplicated
        ? " duplicated"
        : "");

    //show locked language icon
    if (!isUserAdmin() && (isRowSelected || isRowExpanded) && !hasUserAccessToLanguage(langtag)) {
      rowLockedIcon = (<i className="fa fa-lock access-denied-icon" />);
    }
    // Add delete button to default-language row
    // or to every not expanded row
    // will not show when no access
    else if (table.type !== 'settings' && (langtag === TableauxConstants.DefaultLangtag || !isRowExpanded) && isRowSelected) {
      deleteButton = (
        <div className="delete-row">
          <button className="button" onClick={this.onClickDelete}>
            <i className="fa fa-trash"></i>
          </button>
        </div>
      )
    }

    return (
      <div key={this.props.row.getId() + "-" + langtag} className={className} tabIndex="-1"
           onContextMenu={this.contextMenuHandler}>
        {rowLockedIcon}
        {deleteButton}
        <MetaCell langtag={langtag} rowId={this.props.row.getId()}
                  onClick={this.toggleExpand} rowExpanded={this.props.isRowExpanded} />
        {this.renderCells(langtag, selected)}
      </div>
    );
  };

  render = () => {
    const self = this;
    if (this.props.isRowExpanded) {
      // render all language-rows for this row
      const rows = TableauxConstants.Langtags.map(function (langtag) {
        return self.renderLanguageRow(langtag);
      });
      return <div className="row-group expanded" tabIndex="-1">{rows}</div>;
    } else {
      return this.renderLanguageRow(this.props.langtag);
    }
  }
}
;

Row.propTypes = {
  langtag: React.PropTypes.string.isRequired,
  table: React.PropTypes.object.isRequired,
  row: React.PropTypes.object.isRequired,
  selectedCell: React.PropTypes.object,
  selectedCellEditing: React.PropTypes.bool,
  selectedCellExpandedRow: React.PropTypes.string,
  isRowExpanded: React.PropTypes.bool.isRequired,
  isRowSelected: React.PropTypes.bool,
  shouldCellFocus: React.PropTypes.bool
};

export default Row;