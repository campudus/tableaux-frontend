import React, {Component} from "react";
import f from "lodash/fp";
import TableView from "../components/tableView/TableView";
import Spinner from "../components/header/Spinner";
import reduxActionHoc from "../helpers/reduxActionHoc";
import i18n from "i18next";
import {I18nextProvider} from "react-i18next";
import resources from "i18next-resource-store-loader!../../locales/index";
import TableauxConstants from "../constants/TableauxConstants";

const mapStateToProps = (state, props) => {
  console.log(state);
  const {tableId} = props;
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
    i18n.init({
      resources,
      // we need to define just 'en' otherwise fallback doesn't work correctly since i18next tries to load the
      // json only once with the exact fallbackLng Key. So 'en-GB' doesn't work because all
      fallbackLng: "en",
      lng: this.props.langtag,

      // have a common namespace used around the full app
      ns: ["common", "header", "table", "media", "filter", "dashboard"],
      defaultNS: "common",

      debug: false,

      interpolation: {
        escapeValue: false // not needed for react!!
      }
    });
  }
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
    const {table, columns, rows} = this.props;
    if (f.isEmpty(table) || f.isEmpty(rows) || f.isEmpty(columns)) {
      // return <div>waiting</div>
      return <Spinner isLoading />;
    }
    TableauxConstants.initLangtags(table.langtags);
    return (
      <I18nextProvider i18n={i18n}>
        <TableView {...this.props} showCellJumpOverlay={false}/>
      </I18nextProvider>
    );
  }
}

export default reduxActionHoc(TableContainer, mapStateToProps);
