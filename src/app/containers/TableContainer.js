import React, {Component} from "react";
import f from "lodash/fp";
import Table from "../components/table/Table";
import Spinner from "../components/header/Spinner";
import reduxActionHoc from "../helpers/reduxActionHoc";

const mapStateToProps = (state,props) => {
  console.log(state);
  const {tableId} = props;
  const table= f.get(`tables.data.${tableId}`, state);
  const tables= f.get(`tables.data`, state);
  const columns= f.get(`columns.${tableId}.data`, state);
  const rows= f.get(`rows.${tableId}.data`, state);
  // return {...f.pick(["tables.data", "columns.1.data","rows.1.data"], state)}
  return{ table, columns, rows, tables };
};


class TableContainer extends Component {
  componentWillMount() {
    const {
      actions: {loadTables, loadAllRows, loadColumns},
      tableId
    } = this.props;
    loadTables();
    loadAllRows(tableId);
    loadColumns(tableId);
  }
  render() {
    const { table, columns, rows } = this.props;
    if(f.isEmpty(table) ||f.isEmpty(rows)||f.isEmpty(columns)){
      // return <div>waiting</div>
      return <Spinner isLoading />
    }
    return <Table {...this.props} />;
  }
}

export default reduxActionHoc(TableContainer, mapStateToProps);
