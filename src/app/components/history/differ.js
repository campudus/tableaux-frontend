import diff from "fast-diff";
import f from "lodash/fp";

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
    case ColumnKinds.numeric:
    default:
      return showCompleteReplacement(revision, langtag);
  }
});

const calcLinkDiff = ({ fullValue = [], prevContent = [] }) => {
  const added = f.differenceBy("id", fullValue, prevContent);
  const removed = f.differenceBy("id", prevContent, fullValue);
  const unchanged = f.intersectionBy("id", prevContent, fullValue);
  return [
    ...removed.map(link => ({
      del: true,
      value: link
    })),
    ...added.map(link => ({
      add: true,
      value: link
    })),
    ...unchanged.map(link => ({
      value: link
    }))
  ];
};

const calcAttachmentDiff = ({ fullValue = [], prevContent = [] }, langtag) => {
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
      value: retrieveDisplayValue(attachment)
    })),
    ...added.map(attachment => ({
      add: true,
      value: retrieveDisplayValue(attachment)
    })),
    ...unchanged.map(attachment => ({
      value: retrieveDisplayValue(attachment)
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
    f.flatMap(ctry => {
      const valueFrom = f.propOr({}, ctry);
      const oldVal = valueFrom(prevContent);
      const newVal = valueFrom(fullValue);
      return oldVal === newVal // We display a minimal subset of changes for country specific items
        ? null
        : f.isNumber(oldVal) || !f.isEmpty(oldVal) // Number is empty. Don't ask me why
        ? // We can do this because of flatMap
          [
            { del: true, value: oldVal, country: ctry },
            { add: true, value: newVal, country: ctry }
          ]
        : { add: true, value: newVal, country: ctry };
    }),
    f.compact
  )(countries);
};
