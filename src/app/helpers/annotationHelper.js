import Raven from "raven-js";
import i18n from "i18next";

import f from "lodash/fp";

import { extractAnnotations, refreshAnnotations } from "./annotationHelper";
import {
  isFlagAnnotation,
  isMultilangAnnotation,
  isTextAnnotation
} from "../redux/actions/annoation-specs";
import { isText } from "./KeyboardShortcutsHelper";
import { maybe, unless } from './functools';
import { showDialog } from "../components/overlay/GenericOverlay";
import actions from "../redux/actionCreators";
import apiUrl from "./apiUrl";
import store from "../redux/store";

function annotationError(heading, error) {
  const { message } = error;
  console.error(heading, "\n->", message);
  Raven.captureException(error);
  showDialog({
    type: "warning",
    context: i18n.t("common:error"),
    title: i18n.t("table:error_occured_hl"),
    heading,
    message,
    actions: { neutral: [i18n.t("common:ok"), null] }
  });
}

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
  f.flow(
    f.con([
      [isTextAnnotation, f.identity],
      [isFlagAnnotation, f.identity],
      [isMultilangAnnotation, f.identity],
      [f.stubTrue, f.noop]
    ])
  )(annotation);
};

const addTranslationNeeded = (langtag, cell) => {
  const langtags = unless(f.isArray, lt => [lt], langtag);
  store.dispatch(
    actions.addAnnotationLangtags({
      annotation: {
        type: "flag",
        value: "needs_translation",
        langtags
      },
      cell
    })
  );
};

const removeTranslationNeeded = (langtag, cell) => {
  const langtags = unless(f.isArray, lt => [lt], langtag);
  store.dispatch(
    actions.removeAnnotationLangtags({
      annotation: {
        type: "flag",
        value: "needs_translation",
        langtags
      },
      cell
    })
  );
};

function deleteCellAnnotation(annotation, cell) {}

const getRowAnnotationPath = target => {
  const getSingleRowPath = row => {
    return `/tables/${row.tableId}/rows/${row.id}/annotations`;
  };
  const getTableRowsPath = table => {
    return `/tables/${table.id}/rows/annotations`;
  };
  return apiUrl(
    target instanceof Row ? getSingleRowPath(target) : getTableRowsPath(target)
  );
};

const setRowAnnotation = (annotation, target) => {
  const afterRowUpdate = (error, response) => {
    if (error) {
      annotationError(
        `Could not set annotation ${annotation} for row ${target.id}`,
        error
      );
    } else {
      target.set(annotation);
    }
  };

  const afterTableUpdate = (error, response) => {
    if (error) {
      annotationError(
        `Could not set annotation ${annotation} for table ${target.id}`,
        error
      );
    } else {
      target.rows.models.forEach(row => row.set(annotation));
    }
  };

  const url = getRowAnnotationPath(target);
  request
    .patch(url)
    .send(annotation)
    .end(target instanceof Row ? afterRowUpdate : afterTableUpdate);
};

// Stateful variable!
class UnlockedRowManager {
  static unlockedRow = null;

  static getUnlocked() {
    return UnlockedRowManager.unlockedRow;
  }

  static unlock(row) {
    UnlockedRowManager.unlockedRow = row;
  }

  static relock() {
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
  const langtags = f.prop(
    ["annotations", "translationNeeded", "langtags"],
    cell
  );

  return f.isString(langtag)
    ? f.contains(langtag, langtags)
    : !f.isEmpty(langtags);
};

const isLocked = row =>
  row.final &&
  maybe(UnlockedRowManager.getUnlocked())
    .map(f.get("id"))
    .getOrElse(null) !== row.id;

export {
  deleteCellAnnotation,
  addTranslationNeeded,
  removeTranslationNeeded,
  getAnnotation,
  extractAnnotations,
  refreshAnnotations,
  setRowAnnotation,
  setCellAnnotation,
  unlockRow,
  isLocked,
  isTranslationNeeded
};
