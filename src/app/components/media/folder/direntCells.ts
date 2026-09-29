import { Attachment, Folder } from "../../../types/grud";
import { DirentGroup } from "./direntOrdering";

export type ListCell =
  | { kind: "back" }
  | { kind: "group-header"; label: string }
  | { kind: "dirent"; dirent: Attachment | Folder };

const direntCell = (dirent: Attachment | Folder): ListCell => ({
  kind: "dirent",
  dirent
});

const groupCells = (group: DirentGroup<Attachment>): Array<ListCell> => [
  ...(group.label !== null
    ? [{ kind: "group-header", label: group.label } as const]
    : []),
  ...group.dirents.map(direntCell)
];

export const toListCells = (
  hasBack: boolean,
  folders: Array<Folder>,
  fileGroups: Array<DirentGroup<Attachment>>
): Array<ListCell> => [
  ...(hasBack ? [{ kind: "back" } as const] : []),
  ...folders.map(direntCell),
  ...fileGroups.flatMap(groupCells)
];
