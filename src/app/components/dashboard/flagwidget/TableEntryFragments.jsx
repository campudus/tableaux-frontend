import React from "react";
import { getMultiLangValue } from "../../../helpers/multiLanguage";
import { compose, pure, withHandlers } from "recompose";
import classNames from "classnames";
import f from "lodash/fp";
import Header from "./HeaderFragments";
import ElementCount from "./ElementCountFragments";
import { Langtags } from "../../../constants/TableauxConstants";
import { doto } from "../../../helpers/functools";
import { mkAnnotationFilterTemplates } from "../../header/filter/helpers";
import { match, otherwise, when } from "match-iz";

const TableEntry = compose(
  pure,
  withHandlers({
    onMouseEnter: ({ handleMouseEnter, index }) => () => {
      handleMouseEnter(index);
    }
  })
)(
  ({
    active,
    onMouseEnter,
    langtag,
    selectedLang,
    table = {},
    style,
    selected,
    flag
  }) => {
    const latest = f.get(["annotationCount", "latest"], table);
    const cellUrl =
      flag === "comments" && f.isObject(latest)
        ? `/columns/${latest.columnId}/rows/${latest.rowId}`
        : "";

    const translationPercentage =
      selectedLang === f.first(Langtags)
        ? doto(
            table,
            f.get("translationStatus"),
            f.map(f.identity), // get values of all keys in undetermined order
            f.reduce(f.add, -1),
            f.divide(f, Math.max(f.size(Langtags) - 1, 1))
          )
        : f.getOr(0, ["translationStatus", selectedLang], table);

    const templates = mkAnnotationFilterTemplates(langtag);
    const template = match(flag)(
      when("comments", templates.info),
      when(
        "needs-translation",
        langtag === Langtags[0]
          ? templates.needsAnyTranslation
          : templates.needsMyTranslation
      ),
      otherwise(templates[flag])
    );
    const filterQuery = template?.join(":");
    const href = `/${
      flag === "needs-translation" ? selectedLang : langtag
    }/tables/${table.id}${cellUrl}?filter:${filterQuery}`;

    return (
      <a
        className={classNames("table-entry", {
          active,
          selected
        })}
        href={href}
        style={style}
        onMouseEnter={onMouseEnter}
        draggable={false}
      >
        <div className="label">
          {getMultiLangValue(langtag, table.name, table.displayName)}
        </div>
        <ElementCount
          n={f.get(["annotationCount", "count"], table)}
          selected={selected}
          flag={flag}
          perc={(((1 - translationPercentage) * 1000) | 0) / 10} // remove  1 - ... to get "already translated"
        />
      </a>
    );
  }
);

export { Header, TableEntry };
