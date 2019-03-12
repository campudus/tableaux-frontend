import React from "react";
import f from "lodash/fp";

import Spinner from "../components/header/Spinner";
import Tableaux from "../components/Tableaux";
import TableauxConstants from "../constants/TableauxConstants";
import reduxActionHoc from "../helpers/reduxActionHoc";

const mapStateToProps = (state, props) => {
  const {
    initialParams: { tableId }
  } = props;
  const table = f.get(`tables.data.${tableId}`, state);
  const tables = f.get("tables.data", state);
  const columns = f.get(`columns.${tableId}.data`, state);
  const rows = f.get(`rows.${tableId}.data`, state);
  const tableView = f.get("tableView", state);
  return { table, columns, rows, tables, tableView };
};

const TableContainer = props => {
  const { actions, table, columns, rows } = props;
  if (f.isEmpty(table) || f.isEmpty(rows) || f.isEmpty(columns)) {
    return <Spinner isLoading />;
  }
  TableauxConstants.initLangtags(table.langtags);
  return (
    <Tableaux
      initialParams={{ ...props }}
      initialViewName={"TABLE_VIEW"}
      actions={actions}
    />
  );
};

export default reduxActionHoc(TableContainer, mapStateToProps);
