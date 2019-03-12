import TableauxConstants from "../constants/TableauxConstants";
import f from "lodash/fp";
import { makeRequest } from "../helpers/apiHelper";
import apiRoute from "../helpers/apiRoutes";

async function initLangtags() {
  if (f.isNil(TableauxConstants.Langtags)) {
    const requestData = await makeRequest({
      apiRoute: apiRoute.toSetting("langtags")
    });
    TableauxConstants.initLangtags(requestData.value);
    return requestData.value;
  } else {
    return TableauxConstants.Langtags;
  }
}

async function getTables() {
  const requestData = await makeRequest({
    apiRoute: apiRoute.getAllTables()
  });
  return requestData.tables;
}

async function validateLangtag(langtag) {
  const allLangtags = await initLangtags();
  return f.isNil(langtag) || !f.contains(langtag, allLangtags)
    ? TableauxConstants.DefaultLangtag
    : langtag;
}

async function validateTableId(tableId, propTables) {
  // if state has no tables yet we have to get them ourselves
  const tables = propTables.finishedLoading
    ? propTables.data
    : await getTables();

  const firstTableId = f.get("id", f.head(tables));
  const result =
    f.findIndex(table => table.id === tableId, tables) === -1
      ? firstTableId
      : tableId;

  return result;
}

const posOrNil = string => {
  const number = parseInt(string);
  return f.isNumber(number) && number >= 0 ? number : null;
};

export { posOrNil, validateLangtag, validateTableId };
