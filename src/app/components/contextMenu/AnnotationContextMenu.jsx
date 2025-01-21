import React from "react";
import f from "lodash/fp";
import {
  AnnotationConfigs,
  ColumnKinds,
  Langtags
} from "../../constants/TableauxConstants";
import {
  addTranslationNeeded,
  removeTranslationNeeded,
  deleteCellAnnotation,
  setCellAnnotation,
  getAnnotationByName,
  getAnnotationTitle,
  getAnnotationColor
} from "../../helpers/annotationHelper";
import { canUserChangeCell } from "../../helpers/accessManagementHelper";
import AnnotationDot from "../annotation/AnnotationDot";

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

  const annotationItems = f.flow(
    f.filter(({ kind }) => kind === "flag"),
    f.flatMap(config => {
      const annotation = getAnnotationByName(config.name, cell);
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
          title: getAnnotationTitle(config.name, langtag, cell),
          color: getAnnotationColor(config.name),
          annotation,
          action: isTranslationFlag ? translationAction : annotationAction
        }
      ];
    }),
    f.sortBy("priority")
  )(AnnotationConfigs);

  return (
    <div className="context-menu annotation-context-menu">
      {annotationItems.map(({ title, color, annotation, action }) => {
        const hasAnnotation = !!annotation;

        return (
          <button key={title} onClick={action}>
            <AnnotationDot
              className="item-dot"
              color={color}
              active={hasAnnotation}
            />
            <div className="item-label">{title}</div>
            {hasAnnotation && <i className="fa fa-check" />}
          </button>
        );
      })}
    </div>
  );
}
