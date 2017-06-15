import request from "superagent";
import * as f from "lodash/fp";
import apiUrl from "./apiUrl";
import Cell from "../models/Cell";
import Row from "../models/Row";
import {maybe} from "./monads";

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
    [f.stubTrue, f.always({})]
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
  if (!f.isArray(langtags)) console.warn("addTranslationNeeded: array expected, got", langtags);
  const oldCellAnnotations = f.prop("annotations", cell) || {};
  const finishTransaction = (f.isEmpty(f.prop("translationNeeded", oldCellAnnotations)))
    ? (response) => {
      const uuid = f.compose(
        f.prop("uuid"),
        JSON.parse,
        f.prop("text")
      )(response);
      const newTranslationStatus = f.assoc(["translationNeeded", "uuid"], uuid, f.prop(["annotations"], cell));
      cell.set(
        {annotations: newTranslationStatus}
      );
    }
    : (response) => {
    };
  cell.set({
    annotations: f.assoc(
      ["translationNeeded", "langtags"],
      f.uniq(f.union(f.prop(["translationNeeded", "langtags"], oldCellAnnotations), langtags)),
      (f.isBoolean(oldCellAnnotations.translationNeeded)
        ? f.assoc(["translationNeeded"], {}, oldCellAnnotations)
        : oldCellAnnotations)
    )
  });
  request
    .post(cellAnnotationUrl(cell))
    .send({
      type: "flag",
      value: "needs_translation",
      langtags
    })
    .end(
      (error, response) => {
        if (error) {
          cell.set({annotations: oldCellAnnotations}); // rollback on error
          console.error(`Error setting langtag ${langtags}`);
        } else {
          finishTransaction(response);
          refreshRowTranslations(JSON.parse(f.prop("text", response)), cell);
        }
      }
    );
};

const refreshRowTranslations = (xhrResponseBody, cell) => {
  const row = cell.row;
  const cellIdx = f.findIndex(f.matchesProperty("id", cell.id), row.cells.models);
  const rowAnnotations = f.prop("annotations", row);
  const cellAnnotations = f.nth(cellIdx)(rowAnnotations);
  const translationIdx = Math.max(f.findIndex(f.matchesProperty("value", "needsTranslation"), cellAnnotations), 0);
  const newAnnotations = f.assocPath([cellIdx, translationIdx], xhrResponseBody, rowAnnotations || []);
  row.set({annotations: newAnnotations});
};

const removeTranslationNeeded = (langtag, cell) => {
  const oldCellAnnotations = f.prop("annotations", cell) || {};
  const remainingLangtags = f.remove(f.eq(langtag), f.prop(["translationNeeded", "langtags"], oldCellAnnotations));
  const uuid = f.prop(["translationNeeded", "uuid"], oldCellAnnotations);
  cell.set(
    {annotations: f.assoc(["translationNeeded", "langtags"], remainingLangtags, oldCellAnnotations)}
  );
  refreshRowTranslations({
    uuid,
    langtags: remainingLangtags
  }, cell);
  request
    .delete(`${cellAnnotationUrl(cell)}/${uuid}/${langtag}`)
    .end(
      (error, response) => {
        if (error) {
          console.error("Could not remove langtag", langtag);
          cell.set({annotations: oldCellAnnotations});
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
  const {row} = cell;
  const cellIdx = f.findIndex(f.matchesProperty("id", cell.id), row.cells.models);
  const cellAnnotations = f.prop(["annotations", cellIdx]);
  const newAnnotations = f.assocPath([cellIdx],
    f.remove(f.matchesProperty("uuid", uuid, cellAnnotations)),
    f.prop("annotations", row));
  row.set({annotations: newAnnotations});

  if (fireAndForget) {
    r.end(
      (error, result) => {
        if (error) {
          console.error(`Error deleting ${type} annotation ${value}:`, error);
        } else {
          cell.set({annotations: extractAnnotations(newAnnotations)});
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

  const url = getRowAnnotationPath(target);
  request
    .patch(url)
    .send(annotation)
    .end((target instanceof Row) ? afterRowUpdate : afterTableUpdate);
};

// Stateful variable!
class UnlockedRowManager {
  static unlockedRow = null;
  static getUnlocked() {
    return UnlockedRowManager.unlockedRow;
  }
  static unlock(row) {
    UnlockedRowManager.relock();
    UnlockedRowManager.unlockedRow = row;
    row.set({unlocked: true});
  }
  static relock() {
    maybe(UnlockedRowManager.getUnlocked())
      .method("set", {unlocked: false});
    UnlockedRowManager.unlockedRow = null;
  }
}

const unlockRow = (row, unlockState = true) => {
  if (!unlockState) {
    UnlockedRowManager.relock();
  } else {
    UnlockedRowManager.unlock(row);
  }
};

const isTranslationNeeded = langtag => cell => {
  const langtags = f.prop(["annotations", "translationNeeded", "langtags"], cell);

  return (f.isString(langtag))
    ? f.contains(langtag, langtags)
    : !f.isEmpty(langtags);
};

const isLocked = row => row.final && !row.unlocked;

export {
  deleteCellAnnotation,
  addTranslationNeeded,
  removeTranslationNeeded,
  getAnnotation,
  extractAnnotations,
  refreshAnnotations,
  setRowAnnotation,
  unlockRow,
  isLocked,
  isTranslationNeeded
};
export default setCellAnnotation;
