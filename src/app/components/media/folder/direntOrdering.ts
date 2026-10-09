import f from "lodash/fp";
import { Attachment } from "@campudus/grud-sdk/types";
import { getMultiLangValue } from "../../../helpers/multiLanguage";
import { Folder } from "src/app/types/grud";
import { ifElse } from "pragmatic-fp-ts";

export type Direction = "asc" | "desc";
export type Criterion = "by-name" | "by-type" | "by-date";
export type DirentOrder = { criterion: Criterion; direction: Direction };

export const DEFAULT_DIRENT_ORDER: DirentOrder = {
  criterion: "by-name",
  direction: "asc"
};

export const toggleDirection = (order: DirentOrder): DirentOrder => ({
  ...order,
  direction: order.direction === "asc" ? "desc" : "asc"
});

// `label === null` marks dirents that are not grouped
export type DirentGroup<T> = { label: string | null; dirents: Array<T> };

type GetAttachmentProp = (langtag: string) => (_: Attachment) => string;
const getExternalName = (langtag: string, att: Attachment) =>
  getMultiLangValue(langtag)("")(att.externalName);

const getFileNameWithoutCase: GetAttachmentProp = langtag => att =>
  getExternalName(langtag, att).toUpperCase();

const getFileExtension: GetAttachmentProp = langtag => att =>
  f.compose(
    f.toUpper,
    ifElse(
      parts => parts.length > 1,
      f.last,
      () => ""
    ),
    f.split(".")
  )(getExternalName(langtag, att));

const getFileUpdateTimestamp: GetAttachmentProp = _ => att =>
  att.updatedAt ?? "";

const attachmentProps: Record<Criterion, Array<GetAttachmentProp>> = {
  "by-name": [getFileNameWithoutCase],
  "by-type": [getFileExtension, getFileNameWithoutCase],
  "by-date": [getFileUpdateTimestamp, getFileNameWithoutCase]
};
export const sortAttachments = <A extends Attachment>(
  order: DirentOrder,
  langtag: string,
  attachments: Array<A>
): Array<A> => {
  const props = attachmentProps[order.criterion].map(toIteratee =>
    toIteratee(langtag)
  );
  return f.orderBy(
    props,
    f.times(() => order.direction, props.length),
    attachments
  );
};

const groupKeys: Record<Criterion, GetAttachmentProp | null> = {
  "by-name": null,
  "by-type": getFileExtension,
  "by-date": null
};

const groupConsecutive = <T>(
  toKey: (_: T) => string,
  items: Array<T>
): Array<DirentGroup<T>> =>
  items.reduce<Array<DirentGroup<T>>>((groups, item) => {
    const key = toKey(item);
    const current = f.last(groups);
    return current?.label === key
      ? [
          ...groups.slice(0, -1),
          { ...current, dirents: [...current.dirents, item] }
        ]
      : [...groups, { label: key, dirents: [item] }];
  }, []);

export const arrangeAttachments = <A extends Attachment>(
  order: DirentOrder,
  langtag: string,
  attachments: Array<A>
): Array<DirentGroup<A>> => {
  const sorted = sortAttachments(order, langtag, attachments);
  const toGroupKey = groupKeys[order.criterion];
  return toGroupKey
    ? groupConsecutive(toGroupKey(langtag), sorted)
    : sorted.length > 0
      ? [{ label: null, dirents: sorted }]
      : [];
};

const folderProps: Record<Criterion, Array<keyof Folder>> = {
  "by-name": ["name"],
  "by-type": ["name"],
  "by-date": ["updatedAt", "name"]
};
export const sortFolders = (
  order: DirentOrder,
  folders: Array<Folder>
): Array<Folder> => {
  const props = folderProps[order.criterion];
  return f.orderBy(
    props,
    f.times(() => order.direction, props.length),
    folders
  );
};
