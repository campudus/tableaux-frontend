/**
 * This component is for use cases where connectToAmpersand doesn't suffice.
 * The prime purpose is to listen for changes in remote tables; e. g. link tables. ConnectToAmpersand
 * will notice when links to elements change, but not when rows of the toTable get modified.
 */

import React, { Component } from "react";
import { ActionTypes } from "../../constants/TableauxConstants";
import Dispatcher from "../../dispatcher/Dispatcher";
import * as f from "lodash/fp";

const subscribeToTable = ({
  cellToWatch,
  rowToWatch
} = {}) => WrappedComponent =>
  class extends Component {
    constructor(props) {
      super(props);
      this.state = {
        cellData: this.getCellData(cellToWatch),
        rowData: this.getRowData(rowToWatch || cellToWatch.row)
      };

      if (f.isNil(cellToWatch) && f.isNil(rowToWatch)) {
        throw new Error(
          "subscribeToTable(component, options) needs an options object with either a cellToWatch or rowToWatch key"
        );
      }
    }

    getRowData = f.flow(
      f.get(["cells", "models"]),
      f.map(f.pick(["id", "value", "annotations"]))
    );

    getCellData = f.get("value");

    componentDidMount() {
      Dispatcher.on(ActionTypes.BROADCAST_DATA_CHANGE, this.updateData);
    }

    componentWillUnmount() {
      Dispatcher.off(ActionTypes.BROADCAST_DATA_CHANGE, this.updateData);
    }

    isWatchedRow = row =>
      row &&
      row.tableId === rowToWatch.tableId &&
      row.id === rowToWatch.tableId;

    isWatchedCell = cell =>
      (cell && cell.id === cellToWatch.id) ||
      (!cellToWatch.id &&
        cell.id ===
          `cell-${cellToWatch.tableId}-${cellToWatch.columnId}-${cellToWatch.rowId}`);

    updateData = ({ cell, row }) => {
      // dont't update if the changed element is not the watched element
      if (
        (cellToWatch && !this.isWatchedCell(cell)) ||
        (rowToWatch && !this.isWatchedRow(row || f.get("row", cell)))
      ) {
        return;
      }

      this.setState({
        cellData: this.getCellData(cell),
        rowData: this.getRowData(row || cell.row)
      });
    };

    render() {
      return (
        <WrappedComponent
          {...this.props}
          cellData={this.state.cellData}
          rowData={this.state.rowData}
        />
      );
    }
  };

export default subscribeToTable;
