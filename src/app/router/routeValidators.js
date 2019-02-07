import TableauxConstants from "../constants/TableauxConstants";
import f from "lodash/fp";
import Request from "superagent";

let cachedTables = null;

export async function initLangtags() {
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
    if (f.isNil(cachedTables)) {
      Request.get("/api/tables").end((error, response) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          const allTables = response.body.tables;
          cachedTables = allTables;
          resolve(allTables);
        }
      });
    } else {
      return cachedTables;
    }
  });
}

async function validateLangtag(langtag) {
  await initLangtags();
  return f.isNil(langtag) || !f.contains(langtag, TableauxConstants.Langtags)
    ? TableauxConstants.DefaultLangtag
    : langtag;
}

async function getFirstTableId() {
  const tables = await getTables();
  return f.get("id", f.head(tables));
}

async function validateTableId(tableId) {
  // TODO-W
  const firstTableId = await getFirstTableId();
  const tables = await getTables();
  const result = f.cond([
    [f.isNil, firstTableId],
    [id => f.isNil(tables[id]), firstTableId],
    [f.stubTrue, f.identity]
  ])(tableId);

  console.log("valid tableId", result);

  return result;
}

const posOrNil = string => {
  const number = parseInt(string);
  return f.isNumber(number) && number >= 0 ? number : null;
};

export {
  posOrNil,
  validateLangtag,
  validateTableId,
  getFirstTableId,
  getTables
};
