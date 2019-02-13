import TableauxConstants from "../constants/TableauxConstants";
import f from "lodash/fp";
import Request from "superagent";

async function initLangtags() {
  return new Promise((resolve, reject) => {
    if (f.isNil(TableauxConstants.Langtags)) {
      Request.get("/api/system/settings/langtags").end((error, response) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          TableauxConstants.initLangtags(response.body.value);
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

async function getTables() {
  return new Promise((resolve, reject) => {
    Request.get("/api/tables").end((error, response) => {
      if (error) {
        console.error(error);
        reject(error);
      } else {
        const allTables = response.body.tables;
        resolve(allTables);
      }
    });
  });
}

async function validateLangtag(langtag) {
  await initLangtags();
  return f.isNil(langtag) || !f.contains(langtag, TableauxConstants.Langtags)
    ? TableauxConstants.DefaultLangtag
    : langtag;
}

async function validateTableId(tableId, tables) {
  // if state has no tables yet we have to get them ourselves
  if (!tables.finishedLoading) {
    tables = await getTables();
  } else {
    tables = tables.data;
  }

  const firstTableId = f.get("id", f.head(tables));
  const result = f.isNil(tables[tableId]) ? firstTableId : tableId;

  return result;
}

const posOrNil = string => {
  const number = parseInt(string);
  return f.isNumber(number) && number >= 0 ? number : null;
};

export { posOrNil, validateLangtag, validateTableId };
