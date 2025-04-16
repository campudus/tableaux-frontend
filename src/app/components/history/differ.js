import diff from "fast-diff";
import i18n from "i18next";
import f from "lodash/fp";
import { match, when as on, otherwise } from "match-iz";
import { ColumnKinds } from "../../constants/TableauxConstants";
import { retrieveTranslation } from "../../helpers/multiLanguage";

export const calcRevisionDiff = f.curry((cell, langtag, revision) => {
  switch (cell.column.kind) {
    case ColumnKinds.text:
    case ColumnKinds.shorttext:
    case ColumnKinds.richtext:
    case ColumnKinds.date:
    case ColumnKinds.datetime:
      return calcTextDiff(revision, langtag);
    case ColumnKinds.link:
      return calcLinkDiff(revision, langtag);
    case ColumnKinds.attachment:
      return calcAttachmentDiff(revision, langtag);
    case ColumnKinds.currency:
      return calcCountryDiff(revision);
    case ColumnKinds.boolean:
      return showBooleanDiff(revision, langtag);
    case ColumnKinds.numeric:
    default:
      return showCompleteReplacement(revision, langtag);
  }
});

const calcLinkDiff = revision => {
  const { fullValue = [], prevContent = [], currentDisplayValues } = revision;
  const added = f.differenceBy("id", fullValue, prevContent);
  const removed = f.differenceBy("id", prevContent, fullValue);
  const unchanged = f.intersectionBy("id", fullValue, prevContent);

  return [
    ...removed.map(link => ({
      del: true,
      value: link,
      currentDisplayValues
    })),
    ...added.map(link => ({
      add: true,
      value: link,
      currentDisplayValues
    })),
    ...unchanged.map(link => ({
      value: link,
      currentDisplayValues
    }))
  ];
};

const calcAttachmentDiff = (
  { fullValue = [], prevContent = [], currentDisplayValues },
  langtag
) => {
  const added = f.differenceBy("uuid", fullValue, prevContent);
  const removed = f.differenceBy("uuid", prevContent, fullValue);
  const unchanged = f.intersectionBy("uuid", prevContent, fullValue);

  const retrieveDisplayValue = attachment => ({
    // add uuid and value as keys for LinkDiff
    id: attachment.uuid,
    value:
      retrieveTranslation(langtag, attachment.externalName) || attachment.uuid
  });
  return [
    ...removed.map(attachment => ({
      del: true,
      value: retrieveDisplayValue(attachment),
      currentDisplayValues
    })),
    ...added.map(attachment => ({
      add: true,
      value: retrieveDisplayValue(attachment),
      currentDisplayValues
    })),
    ...unchanged.map(attachment => ({
      value: retrieveDisplayValue(attachment),
      currentDisplayValues
    }))
  ];
};

const calcTextDiff = ({ displayValue, prevDisplayValue }, langtag) => {
  try {
    return diff(
      prevDisplayValue[langtag] || "",
      displayValue[langtag] || ""
    ).map(([action, value]) => ({
      add: action > 0,
      del: action < 0,
      value
    }));
  } catch (err) {
    return { add: true, value: displayValue[langtag] || "" };
  }
};

const showBooleanDiff = ({ value }, langtag) => {
  const boolValue = !!(f.isObject(value) ? value[langtag] : value);
  return [{ add: true, value: i18n.t(boolValue ? "common:yes" : "common:no") }];
};

const showCompleteReplacement = ({ displayValue, prevDisplayValue }, langtag) =>
  prevDisplayValue[langtag].trim() !== displayValue[langtag].trim()
    ? [
        { del: true, value: prevDisplayValue[langtag] },
        { add: true, value: displayValue[langtag] }
      ]
    : [{ value: displayValue[langtag] }];

const calcCountryDiff = ({ fullValue, prevContent }) => {
  const countries = f.union(f.keys(fullValue), f.keys(prevContent));
  return f.flow(
    f.flatMap(country => {
      const valueFrom = f.propOr({}, country);
      const isNotEmpty = f.complement(f.isEmpty);
      const exists = f.anyPass([f.isNumber, isNotEmpty]);

      const oldVal = valueFrom(prevContent);
      const newVal = valueFrom(fullValue);

      const state = {
        hadValue: exists(oldVal),
        hasValue: exists(newVal),
        equals: oldVal === newVal
      };
      return match(state)(
        on({ equals: true }, null),
        on({ hadValue: true, hasValue: true }, [
          { del: true, value: oldVal, country },
          { add: true, value: newVal, country }
        ]),
        on(
          { hadValue: false, hasValue: true },
          { add: true, value: newVal, country }
        ),
        on(
          { hadValue: true, hasValue: false },
          { del: true, value: oldVal, country }
        ),
        otherwise({ value: newVal, country })
      );
    }),
    f.compact
  )(countries);
};
