import request from "superagent";
import * as f from "lodash/fp";
import apiUrl from "./apiUrl";
import Cell from "../models/Cell";
import Row from "../models/Row";
import Cookies from "js-cookie";
import {spy} from "./monads";

const extractAnnotations = obj => {
  const findAnnotationType = typeStr => f.filter(f.matchesProperty("type", typeStr));
  const findAnnotationFlag = (flagStr, obj) => f.compose(
    f.first,
    f.filter(f.matchesProperty("value", flagStr, findAnnotationType("flag")))
  )(obj);
  const getTextAnnotation = name => obj => {
    const annotationOfType = f.first(findAnnotationType(name)(obj));
    return (annotationOfType)
      ? {
        [name]: {
          text: annotationOfType.value,
          uuid: annotationOfType.uuid
        }
      }
      : {};
  };
  const getNeededTranslations = obj => {
    const neededTranslations = findAnnotationFlag("needs_translation", obj);
    return (neededTranslations)
      ? {
        translationNeeded: {
          langtags: neededTranslations.langtags,
          uuid: neededTranslations.uuid
        }
      }
      : {};
  };
  return f.reduce(
    f.merge,
    {},
    f.juxt(  // array of results after applying all functions to obj
      [
        getTextAnnotation("warning"),
        getTextAnnotation("error"),
        getTextAnnotation("info"),
        getNeededTranslations
      ]
    )(obj)
  );
};

const cellAnnotationUrl = cell => {
  const {tableId} = cell;
  const rowId = cell.row.id;
  const colId = cell.column.id;
  return apiUrl(`/tables/${tableId}/columns/${colId}/rows/${rowId}/annotations`);
};

const cellRowUrl = cell => {
  const {tableId} = cell;
  const rowId = cell.row.id;
  return apiUrl(`/tables/${tableId}/rows/${rowId}`);
};

const refreshAnnotations = item => {
  const isInstanceOf = type => el => {
    return el instanceof type;
  };
  f.cond([
    [isInstanceOf(Cell), refreshCellAnnotations],
    [isInstanceOf(Row), refreshRowAnnotations]
  ])(item);
};

// Refresh annotations without reloading the table; making Ampersand refresh rows will break the react elements
const refreshCellAnnotations = cell => {
  request
    .get(cellRowUrl(cell))
    .end(
      (error, response) => {
        if (error) {
          console.error("Could not refresh cell", cell.id, error);
        } else {
          const cellIdx = f.findIndex(f.equals(cell), cell.row.cells.models);
          const cellAnnotations = f.compose(
            extractAnnotations,
            f.nth(cellIdx),
            f.prop("annotations"),
            JSON.parse,
            f.prop("text")
          )(response);
          const updatedAnnotations = f.merge(
            f.mapValues(f.stubFalse, cell.annotations),   // clear old annotations, as empty ones only get ignored
            cellAnnotations
          );
          cell.set({annotations: updatedAnnotations});
          refreshRowAnnotations(cell.row);
        }
      }
    );
};

const refreshRowAnnotations = row => {
  request
    .get(apiUrl(`tables/${row.tableId}/rows/${row.id}`))
    .end(
      (error, response) => {
        if (error) {
          console.error(`Could not refresh row ${row.id}:`, error);
        } else {
          const rowAnnotations = f.compose(
            f.prop("annotations"),
            JSON.parse,
            f.prop("text")
          )(response);
          row.set({annotations: rowAnnotations});
        }
      }
    );
};

const isFlag = ann => f.matchesProperty("type", "flag")(ann);
const isText = ann => f.contains(f.prop("type", ann), ["info", "warning", "error"]);

const getAnnotation = (annotation, cell) => {
  const cellAnnotations = cell.annotations;
  const getFlag = ann => f.prop([ann.value], cellAnnotations);
  const getText = ann => f.prop(f.prop(annotation.type, ann), cellAnnotations);
  return f.cond([
    [isFlag, getFlag],
    [isText, getText],
    [f.stubTrue, f.always(null)]
  ])(annotation);
};

const setCellAnnotation = (annotation, cell) => {
  const r = request
    .patch(cellAnnotationUrl(cell))
    .send(annotation);
  if (getAnnotation(annotation, cell)) {
    deleteCellAnnotation(annotation, cell)
      .then(r.end((error, result) => {
        if (error) {
          console.error("Error setting annotation", error);
        }
      }));
  } else {
    r.end((error, result) => {
      if (error) {
        console.error("Error setting annotation", error);
      } else {
        refreshAnnotations(cell);
      }
    });
  }
};

const addTranslationNeeded = (langtags, cell) => {
  console.log("Settings translation needed for", f.prop(["annotations", "translationNeeded", "langtags"], cell), "=>", langtags)
  request
    .post(cellAnnotationUrl(cell))
    .send({
      type: "flag",
      value: "needs_translation",
      langtags
    })
    .end(
      (error, result) => {
        if (error) {
          console.error(`Error setting langtag ${langtags}`);
        } else {
          refreshAnnotations(cell);
        }
      }
    );
};

const deleteCellAnnotation = (annotation, cell, fireAndForget) => {
  if (!annotation || !annotation.uuid) {
    return;
  }
  const {uuid, type, value} = annotation;
  const r = request.delete(`${cellAnnotationUrl(cell)}/${uuid}`);

  if (fireAndForget) {
    r.end(
      (error, result) => {
        if (error) {
          console.error(`Error deleting ${type} annotation ${value}:`, error);
        } else {
          refreshAnnotations(cell);
        }
      }
    );
  } else {
    return r;
  }
};

const getRowAnnotationPath = target => {
  const getSingleRowPath = row => {
    return `/tables/${row.tableId}/rows/${row.id}/annotations`;
  };
  const getTableRowsPath = table => {
    return `/tables/${table.id}/rows/annotations`;
  };
  return apiUrl((target instanceof Row) ? getSingleRowPath(target) : getTableRowsPath(target));
};

const setRowAnnotation = (annotation, target) => {
  const afterRowUpdate = (error, response) => {
    if (error) {
      console.error("Could not set annotation", annotation, "for row", target.id);
    } else {
      target.set(annotation);
    }
  };

  const afterTableUpdate = (error, response) => {
    if (error) {
      console.error("Could not set annotation", annotation, "for table", target.id);
    } else {
      target.rows.models.forEach(row => row.set(annotation));
    }
  };

  const url = spy(getRowAnnotationPath(target), "annotation url");
  request
    .patch(url)
    .send(annotation)
    .end((target instanceof Row) ? afterRowUpdate : afterTableUpdate);
};

const sessionUnlock = el => {
  const key = `table-${el.tableId || el.id}`;
  const value = JSON.parse(Cookies.get(key) || "[]");
  if (el instanceof Row && value !== true) {
    Cookies.set(key, (value === true) ? [el.id] : f.uniq([...value, el.id]));
    el.set({final: false});
  } else {
    Cookies.set(key, true);
    el.table.rows.models.forEach(row => row.set({final: false}));
  }
};

const isLocked = el => {
  const key = `table-${el.tableId || el.id}`;
  const value = JSON.parse(Cookies.get(key) || "[]");
  return (el instanceof Row)
    ? value !== true && !f.contains(el.id, value)
    : value !== true;
};

export {
  deleteCellAnnotation,
  addTranslationNeeded,
  getAnnotation,
  extractAnnotations,
  refreshAnnotations,
  setRowAnnotation,
  sessionUnlock,
  isLocked
};
export default setCellAnnotation;
