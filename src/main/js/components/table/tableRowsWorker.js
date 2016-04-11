import ActionCreator from '../../actions/ActionCreator';
import React  from 'react';
import {RowHeight} from '../../constants/TableauxConstants';

export function duplicateRow(payload) {
  const {rows} = this.props;
  const {tableRowsDom} = this;
  const {rowId} = payload;
  const rowToCopy = rows.get(rowId);


  const jumpToRow = (row) => {
    return (event) => {
      scrollToRow.call(this, row);
    };
  };

  rowToCopy.duplicate((row) => {
    const duplicatedMessage = (
      <div>
        <p>Row duplicated!</p>
        <a href="#" onClick={jumpToRow(row)}>Jump to row</a>
      </div>
    );
    ActionCreator.showToast(duplicatedMessage, 5000, true);
  });
}

//TODO: Move all this to rows component, with props/actions. Problem is, this executes faster, than the row added to dom, so we get old height.
export function scrollToRow(row) {
  const {tableRowsDom} = this;
  const {rows} = this.props;
  const indexOfRow = rows.indexOf(row);
  const yPositionRow = RowHeight * indexOfRow;
  const rowsDomHeight = tableRowsDom.scrollHeight;
  const rowsDomScrollTop = tableRowsDom.scrollTop;
  const rowsViewportHeight = tableRowsDom.clientHeight;
  console.log("row added at index:", indexOfRow, ". jump to bottom at y:", yPositionRow + RowHeight - rowsViewportHeight, ", new row:", row, " is duplicated", row.recentlyDuplicated);

  this.disableShouldCellFocus();
  tableRowsDom.scrollTop = rowsDomHeight - rowsViewportHeight;
}