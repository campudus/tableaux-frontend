import i18n from "i18next";
import f from "lodash/fp";
import React from "react";
import { ifElse, when } from "../../../helpers/functools";

const FlagDiff = props => {
  const {
    revision,
    revision: { event }
  } = props;

  const value = ifElse(
    f.isString,
    when(f.eq("final"), () => "final.final"),
    f.compose(
      when(f.eq("needs_translation"), () => "translations.translation_needed"),
      f.first,
      f.values
    ),
    revision.value || revision.valueType
  );

  const translationKey =
    value === "archived" ? "table:archived:is-archived" : `table:${value}`;

  return (
    <div
      className={
        "diff-flag-item__flag-type action-item " +
        when(
          f.eq("translations.translation_needed"),
          () => "translation",
          value
        ) +
        " " +
        event
      }
    >
      {i18n.t(translationKey)}
    </div>
  );
};

export default FlagDiff;
