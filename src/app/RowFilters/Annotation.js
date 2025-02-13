import f from "lodash/fp";

const Mode = {
  isSet: "is-set",
  isUnset: "is-unset",
  hasLanguage: "has-language"
};

const Getter = {
  flagType: "flag-type",
  type: "type"
};

export default {
  Mode,
  get: {
    [Getter.flagType]: kind => annotations =>
      Array.isArray(annotations)
        ? annotations?.find(a => a.type === "flag" && a.value === kind)
        : null,
    [Getter.type]: kind => annotations =>
      Array.isArray(annotations)
        ? annotations?.find(a => a.type === kind)
        : null
  },
  [Mode.isSet]: (findAnnotation, columns) => (row, _, ctx) => {
    const visibleColumns = ctx.get();
    return row.annotations?.reduce((found, annotations, idx) => {
      const ann = findAnnotation(annotations);
      // Translation annotations are still not set if they exist but no language needs translation
      if (ann?.langtags ? ann.langtags.length > 0 : ann) {
        visibleColumns.add(columns[idx]?.id);
        return true;
      } else return found;
    }, false);
  },
  [Mode.isUnset]: findAnnotation => row => {
    return row.annotations?.every(
      // Translation annotations are still not set if they exist but no language needs translation
      // Others will short-circuit to falsy values
      annotations => f.isEmpty(f.prop("langtags", findAnnotation(annotations)))
    );
  },
  [Mode.hasLanguage]: (findAnnotation, columns, langtag) => (row, _, ctx) => {
    const visibleColumns = ctx.get();
    return row.annotations?.reduce((found, annotations, idx) => {
      if (f.prop("langtags", findAnnotation(annotations))?.includes(langtag)) {
        visibleColumns.add(columns[idx]?.id);
        return true;
      } else return found;
    }, false);
  }
};
