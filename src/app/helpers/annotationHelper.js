import f from "lodash/fp";

import { extractAnnotations, refreshAnnotations } from "./annotationHelper";
import {
  isFlagAnnotation,
  isMultilangAnnotation,
  isTextAnnotation
} from "../redux/actions/annotation-specs";
import { maybe, unless } from "./functools";
import { setRowFlag } from "../redux/actions/annotationActions";
// import { showDialog } from "../components/overlay/GenericOverlay";
import actions from "../redux/actionCreators";
import store from "../redux/store";

// function annotationError(heading, error) {
//   const { message } = error;
//   console.error(heading, "\n->", message);
//   Sentry.captureException(error);
//   showDialog({
//     type: "warning",
//     context: i18n.t("common:error"),
//     title: i18n.t("table:error_occured_hl"),
//     heading,
//     message,
//     actions: { neutral: [i18n.t("common:ok"), null] }
//   });
// }

const getAnnotation = (annotation, cell) => {
  const cellAnnotations = cell.annotations;
  const getFlag = ann => f.prop([ann.value], cellAnnotations);
  const getText = ann => f.prop(f.prop(annotation.type, ann), cellAnnotations);
  return f.cond([
    [isFlagAnnotation, getFlag],
    [isTextAnnotation, getText],
    [f.stubTrue, f.always({})]
  ])(annotation);
};

const setCellAnnotation = (annotation, cell) => {
  const payload = { annotation, cell };
  const action = isTextAnnotation(annotation)
    ? actions.addTextAnnotation
    : isMultilangAnnotation(annotation)
    ? actions.addAnnotationLangtags
    : actions.toggleAnnotationFlag;
  store.dispatch(action(payload));
};

const deleteCellAnnotation = (annotation, cell) =>
  new Promise((resolve, reject) => {
    const payload = {
      annotation,
      cell,
      setTo: false,
      onError: reject,
      onSuccess: resolve
    };
    const action = isTextAnnotation(annotation)
      ? actions.removeTextAnnotation
      : isMultilangAnnotation(annotation)
      ? actions.removeAnnotationLangtags
      : actions.toggleAnnotationFlag;
    store.dispatch(action(payload));
  });

const addTranslationNeeded = (langtag, cell) =>
  new Promise((resolve, reject) => {
    const langtags = unless(f.isArray, lt => [lt], langtag);
    store.dispatch(
      actions.addAnnotationLangtags({
        annotation: {
          type: "flag",
          value: "needs_translation",
          langtags
        },
        onError: reject,
        onSuccess: resolve,
        cell
      })
    );
  });

const removeTranslationNeeded = (langtagOrLangtags, cell) =>
  new Promise((resolve, reject) => {
    const langtags = unless(f.isArray, lt => [lt], langtagOrLangtags);
    store.dispatch(
      actions.removeAnnotationLangtags({
        annotation: {
          type: "flag",
          value: "needs_translation",
          langtags
        },
        onError: reject,
        onSuccess: resolve,
        cell
      })
    );
  });

const setRowFinal = ({ table, row, value = true }) => {
  setRowAnnotation({ table, row, flagName: "final", flagValue: value });
};

const setRowAnnotation = ({ table, row, flagName, flagValue }) => {
  store.dispatch(setRowFlag({ table, row, flagName, flagValue }));
};

// Singleton
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
  row &&
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
  setRowFinal,
  unlockRow,
  isLocked,
  isTranslationNeeded
};
