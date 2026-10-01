import { Attachment, Folder } from "../../../types/grud";
import { DirentGroup } from "./direntOrdering";

export type DirentListEntry =
  | { kind: "back" }
  | { kind: "group-header"; label: string }
  | { kind: "dirent"; dirent: Attachment | Folder };

const direntEntry = (dirent: Attachment | Folder): DirentListEntry => ({
  kind: "dirent",
  dirent
});

const groupEntries = (
  group: DirentGroup<Attachment>
): Array<DirentListEntry> => [
  ...(group.label !== null
    ? [{ kind: "group-header", label: group.label } as const]
    : []),
  ...group.dirents.map(direntEntry)
];

export const toDirentListEntries = (
  hasBack: boolean,
  folders: Array<Folder>,
  fileGroups: Array<DirentGroup<Attachment>>
): Array<DirentListEntry> => [
  ...(hasBack ? [{ kind: "back" } as const] : []),
  ...folders.map(direntEntry),
  ...fileGroups.flatMap(groupEntries)
];
