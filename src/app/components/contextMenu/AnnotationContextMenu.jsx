import React from "react";
import f from "lodash/fp";
import {
  AnnotationConfigs,
  ColumnKinds,
  Langtags
} from "../../constants/TableauxConstants";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import {
  addTranslationNeeded,
  removeTranslationNeeded,
  deleteCellAnnotation,
  setCellAnnotation
} from "../../helpers/annotationHelper";
import { buildClassName } from "../../helpers/buildClassName";
import { canUserChangeCell } from "../../helpers/accessManagementHelper";

export default function AnnotationContextMenu({ cell, langtag }) {
  const canTranslate = cell => {
    return (
      cell.column.multilanguage &&
      canUserChangeCell(cell, langtag) &&
      !f.contains(cell.kind, [
        ColumnKinds.currency,
        ColumnKinds.link,
        ColumnKinds.attachment,
        ColumnKinds.concat,
        ColumnKinds.status
      ])
    );
  };

  // eslint-disable-next-line camelcase
  const keyMap = { needs_translation: "translationNeeded" };
  const getKey = key => keyMap[key] ?? key;

  console.log(cell.value, { cell });

  const annotationItems = f.flow(
    f.filter(({ kind }) => kind === "flag"),
    f.flatMap(config => {
      const annotation = f.get(["annotations", getKey(config.name)], cell);
      const hasAnnotation = !!annotation;
      const uuid = f.propOr(null, ["uuid"], annotation);
      const opts = { type: "flag", value: config.name };
      const isTranslationFlag = config.name === "needs_translation";
      const isPrimaryLanguage = langtag === f.first(Langtags);
      const langtags = f.propOr([], ["langtags"], annotation);
      const langtagsNew = isPrimaryLanguage ? f.drop(1)(Langtags) : [langtag];
      const langtagsRemaining = f.xor(langtags, langtagsNew);
      const langtagsRemove = f.intersection(langtags, langtagsNew);
      const translationAction = f.isEmpty(langtagsRemaining)
        ? () => deleteCellAnnotation({ ...opts, uuid }, cell)
        : !f.includes(langtag, langtags)
        ? () => addTranslationNeeded(langtagsNew, cell)
        : () => removeTranslationNeeded(langtagsRemove, cell);
      const annotationAction = hasAnnotation
        ? () => deleteCellAnnotation({ ...opts, uuid }, cell)
        : () => setCellAnnotation(opts, cell);

      if (isTranslationFlag && !canTranslate(cell)) {
        return [];
      }

      return [
        {
          config,
          annotation,
          action: isTranslationFlag ? translationAction : annotationAction
        }
      ];
    }),
    f.sortBy("priority")
  )(AnnotationConfigs);

  return (
    <div className="context-menu annotation-context-menu">
      {annotationItems.map(({ config, annotation, action }) => {
        const hasAnnotation = !!annotation;

        return (
          <button key={config.name} onClick={action}>
            <div
              className={buildClassName("item-dot", { active: hasAnnotation })}
              style={{
                color: config?.bgColor,
                backgroundColor: config?.bgColor
              }}
            />
            <div className="item-label">
              {retrieveTranslation(langtag, config?.displayName)}
            </div>
            {hasAnnotation && <i className="fa fa-check" />}
          </button>
        );
      })}
    </div>
  );
}
