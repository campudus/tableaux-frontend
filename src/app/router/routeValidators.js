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
  const objToArray = f.compose(
    f.sortBy(f.prop("id")),
    f.values
  );
  const tables = propTables.finishedLoading
    ? objToArray(propTables.data)
    : await getTables();

  const firstTableId = f.get([0, "id"], tables);
  return f.find(table => table.id === tableId, tables) ? tableId : firstTableId;
}

const posOrNil = string => {
  const number = parseInt(string);
  return f.isNumber(number) && number >= 0 ? number : null;
};

export { posOrNil, validateLangtag, validateTableId };
