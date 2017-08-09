const AmpersandModel = require("ampersand-model");
import apiUrl from "../helpers/apiUrl";
import Request from "superagent";
import {noPermissionAlertWithLanguage} from "../components/overlay/ConfirmationOverlay.jsx";
import {getUserLanguageAccess, isUserAdmin} from "../helpers/accessManagementHelper";
import * as f from "lodash/fp";
import {extractAnnotations} from "../helpers/annotationHelper";
import {ColumnKinds} from "../constants/TableauxConstants";
import {forkJoin} from "../helpers/functools";

const Cells = require("./Cells");

const Row = AmpersandModel.extend({
  props: {
    id: "number",
    values: "array",
    annotations: "array",
    final: "boolean"
  },

  session: {
    tableId: "number",
    columns: "object",
    recentlyDuplicated: {
      type: "boolean",
      default: false
    },
    unlocked: "boolean"
  },

  collections: {
    cells: Cells
  },

  duplicate: function (cb) {
    /**
     * Basic language access management
     */
    if (!isUserAdmin()) {
      noPermissionAlertWithLanguage(getUserLanguageAccess());
      return;
    }

    // We need to create a new row, or the current is getting changed
    let copiedRow = new Row(
      {
        id: this.id,
        tableId: this.tableId
      },
      {
        collection: this.collection,
        parent: this.parent
      });

    copiedRow.save(null, {
      url: this.url() + "/duplicate",
      method: "POST",
      data: "", // we don't want so send any data to the server
      success: (row) => {
        row.recentlyDuplicated = true;
        this.collection.add(row);
        cb(row);
      },
      error: (error) => {
        console.log("error duplicating row.", error);
      }
    });
  },

  safelyDuplicate: function (cb) {
    const self = this;
    return new Promise(
      function (resolve, reject) {
        const hasCardinality = f.compose(
          f.any((n) => (n || 0) > 0),
          f.props(["to", "from"]),
          f.get(["column", "constraint", "cardinality"]),
        );

        const valueShouldBeCopied = (cell) => !f.contains(cell.kind, [ColumnKinds.concat, ColumnKinds.group])
          && !(cell.kind === ColumnKinds.link && hasCardinality(cell));

        const valuesToCopy = f.compose(
          f.reduce(
            (coll, cell) => forkJoin(
              (id, val) => (
                {
                  id: [...coll.id, {id}],
                  value: [...coll.value, val]
                }
              ),
              f.get(["column", "id"]),
              f.get("value"),
              cell
            ),
            {
              id: [],
              value: []
            }
          ),
          f.filter(valueShouldBeCopied)
        )(self.cells.models);

        const rowsUrl = apiUrl(`/tables/${self.tableId}/rows`);
        const cellData = {
          columns: valuesToCopy.id,
          rows: [{values: valuesToCopy.value}]
        };

        const storeData = () => new Promise(
          (resolve, reject) => {
            Request
              .post(rowsUrl)
              .send(cellData)
              .end(
                (err, response) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(JSON.parse(response.text).rows);
                  }
                }
              );
          }
        );

        const fetchAndParse = (rowData) => new Promise(
          (resolve, reject) => {
            self.collection.fetchById(
              rowData[0].id,
              (err, row) => {
                if (err) {
                  reject(err);
                } else {
                  row.recentlyDuplicated = true;
                  f.isFunction(cb) && cb(row);
                  resolve(row);
                }
              }
            );
          }
        );

        storeData()
          .then(fetchAndParse)
          .then(resolve);
      }
    ).catch(
      (err) => {
        console.error("Error while trying to duplicate row", this.id, this.url(), err);
        throw (err);
      }
    );
  },

  dependent: function (onError, onSuccess) {
    console.log("this row id:", this.getId(), " this: ", this);

    console.log("url is:", this.url() + "/dependent");
    return Request.get(this.url() + "/dependent")
                  .end(
                    (error, result) => {
                      if (error) {
                        console.warn("error getting row dependent from server:", error);
                        onError(error);
                      } else {
                        console.log("row dependent response:", result);
                        onSuccess(result.body.dependentRows);
                      }
                    }
                  );
  },

  parse: function (attrs, options) {
    if (attrs && attrs.values) {
      const values = f.zip(attrs.values, attrs.annotations);
      attrs.cells = values.map(function ([value, annotations], idx) {
        return {
          index: idx,
          value,
          annotations: extractAnnotations(annotations),
          rowId: attrs.id
        };
      });
      return attrs;
    } else { // When adding a new row attrs has correct values
      return attrs;
    }
  },

  url: function () {
    const base = this.urlRoot();

    if (this.isNew()) {
      return base;
    } else {
      return base + "/" + this.getId();
    }
  },

  urlRoot: function () {
    // first try tableId because there could be a Row with out collection
    const tableId = this.tableId || this.collection.parent.getId();
    return apiUrl("/tables/" + tableId + "/rows");
  }
});

module.exports = Row;
