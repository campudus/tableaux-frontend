import TableauxConstants from "../constants/TableauxConstants";
import Tables from "../models/Tables";
import f from "lodash/fp";

let cachedTables = null;

const getTables = () => new Promise(
  (resolve, reject) => {
    if (f.isNil(cachedTables)) {
      const tables = new Tables();
      tables.fetch({
        success: () => {
          cachedTables = tables;
          resolve(cachedTables);
        },
        error: (err) => {
          reject(err);
        }
      });
    } else {
      resolve(cachedTables);
    }
  }
);

const validateLangtag = (langtag) => {
  return (f.isNil(langtag) || !f.contains(langtag, TableauxConstants.Langtags))
    ? TableauxConstants.DefaultLangtag
    : langtag;
};

async function getFirstTableId() {
  const tables = await getTables();
  return f.get("id", tables.first());
}

async function validateTableId(tableId) {
  const tables = await getTables();
  const firstTableId = f.always(await getFirstTableId());
  return f.cond([
    [f.isNil, firstTableId],
    [(id) => f.isNil(tables.get(id)), firstTableId],
    [f.stubTrue, f.identity]
  ])(tableId);
}

const posOrNil = (string) => {
  const number = parseInt(string);
  return (f.isNumber(number) && number >= 0) ? number : null;
};

export {posOrNil, validateLangtag, validateTableId, getFirstTableId, getTables};
