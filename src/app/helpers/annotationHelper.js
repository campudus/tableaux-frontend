import f from "lodash/fp";
import { match, otherwise, when, includedIn } from "match-iz";
import i18n from "i18next";
import { extractAnnotations, refreshAnnotations } from "./annotationHelper";
import { AnnotationConfigs, Langtags } from "../constants/TableauxConstants";
import {
  isFlagAnnotation,
  isMultilangAnnotation,
  isTextAnnotation
} from "../redux/actions/annotation-specs";
import { maybe, unless } from "./functools";
import { setRowFlag } from "../redux/actions/annotationActions";
import actions from "../redux/actionCreators";
import store from "../redux/store";
import { retrieveTranslation } from "./multiLanguage";

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

const setRowArchived = ({ table, row, archived = true }) => {
  setRowAnnotation({ table, row, flagName: "archived", flagValue: archived });
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

const getAnnotationConfig = annotationKey => {
  const configsByName = f.indexBy("name", AnnotationConfigs);

  return match(annotationKey)(
    when(
      includedIn(
        "needsAnyTranslation",
        "needsMyTranslation",
        "translationNeeded"
      ),
      () => f.prop(["needs_translation"], configsByName)
    ),
    otherwise(() => f.prop([annotationKey], configsByName))
  );
};

const getAnnotationTitle = (
  annotationKey,
  langtag,
  cell,
  fallbackTitle = annotationKey
) => {
  const config = getAnnotationConfig(annotationKey);
  const displayName = match(annotationKey)(
    when("info", i18n.t("filter:has-comments")),
    when("final", i18n.t("table:filter.is_final")),
    when("archived", i18n.t("table:archived:is-archived")),
    otherwise(retrieveTranslation(i18n.language, config?.displayName))
  );

  const isTranslationAnnotation = config?.name === "needs_translation";
  const primaryLangtag = f.first(Langtags);
  const isPrimaryLangtag = langtag === primaryLangtag;
  const needsTranslation = isTranslationNeeded(langtag)(cell);
  const suffix =
    annotationKey === "needsMyTranslation" ||
    (isTranslationAnnotation && !isPrimaryLangtag && needsTranslation)
      ? `: ${langtag}`
      : "";

  return displayName + suffix || fallbackTitle || "";
};

const getAnnotationColor = (annotationKey, fallbackColor = "#bbbbbb") => {
  const config = getAnnotationConfig(annotationKey);

  return f.propOr(fallbackColor, ["bgColor"], config);
};

const getAnnotationByName = (configName, cell) => {
  const annotationKey = match(configName)(
    when("needs_translation", "translationNeeded"),
    otherwise(configName)
  );

  return f.get(["annotations", annotationKey], cell);
};

export {
  deleteCellAnnotation,
  addTranslationNeeded,
  removeTranslationNeeded,
  getAnnotation,
  extractAnnotations,
  refreshAnnotations,
  setRowArchived,
  setRowAnnotation,
  setCellAnnotation,
  setRowFinal,
  unlockRow,
  isLocked,
  isTranslationNeeded,
  getAnnotationTitle,
  getAnnotationColor,
  getAnnotationConfig,
  getAnnotationByName
};
