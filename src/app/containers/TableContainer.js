import React, {Component} from "react";
import f from "lodash/fp";
import TableView from "../components/tableView/TableView";
import Spinner from "../components/header/Spinner";
import reduxActionHoc from "../helpers/reduxActionHoc";
import i18n from "i18next";
import {I18nextProvider} from "react-i18next";
import resources from "i18next-resource-store-loader!../../locales/index";
import TableauxConstants from "../constants/TableauxConstants";
import Tableaux from "../components/Tableaux";

const mapStateToProps = (state, props) => {
  console.log(state);
  const {
    initialParams: {tableId}
  } = props;
  const table = f.get(`tables.data.${tableId}`, state);
  const tables = f.get(`tables.data`, state);
  const columns = f.get(`columns.${tableId}.data`, state);
  const rows = f.get(`rows.${tableId}.data`, state);
  // return {...f.pick(["tables.data", "columns.1.data","rows.1.data"], state)}
  return {table, columns, rows, tables};
};

class TableContainer extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const {table, columns, rows,initialParams} = this.props;
    console.log(this.props);
    if (f.isEmpty(table) || f.isEmpty(rows) || f.isEmpty(columns)) {
      // return <div>waiting</div>
      return <Spinner isLoading />;
    }
    TableauxConstants.initLangtags(table.langtags);
    return (
      <Tableaux
        initialParams={{...this.props}}
        initialViewName={"TABLE_VIEW"}
      />
    );
  }
}

export default reduxActionHoc(TableContainer, mapStateToProps);
