import { ReactElement } from "react";
import { AutoSizer } from "react-virtualized";
import { Virtuoso, VirtuosoGrid } from "react-virtuoso";
import { Attachment, Folder, FolderID } from "../../../types/grud";
import { buildClassName as cn } from "../../../helpers/buildClassName";
import { Layout, ToggleAction } from "./AttachmentOverlay";
import FolderDirentGroupHeader from "../../media/folder/FolderDirentGroupHeader";
import { DirentGroup } from "../../media/folder/direntOrdering";
import {
  DirentListEntry,
  toDirentListEntries
} from "../../media/folder/direntListEntries";
import AttachmentDirent from "./AttachmentDirent";
import AttachmentDirentNav from "./AttachmentDirentNav";
import List from "./LayoutComponents/List";
import ListItem from "./LayoutComponents/ListItem";
import Grid from "./LayoutComponents/Grid";
import GridItem from "./LayoutComponents/GridItem";

type AttachmentDirentsProps = {
  className?: string;
  langtag: string;
  files?: Attachment[];
  // grouped files take precedence over `files`; labelled groups get a separator
  fileGroups?: DirentGroup<Attachment>[];
  subfolders?: Folder[];
  layout: Layout;
  onNavigate: (id?: FolderID | null) => void;
  onNavigateBack?: () => void;
  onToggle?: (file: Attachment, action: ToggleAction) => void;
  onFindAction?: (file: Attachment) => ToggleAction;
  sortable?: boolean;
};

export default function AttachmentDirents({
  className,
  langtag,
  files = [],
  fileGroups = [{ label: null, dirents: files }],
  subfolders = [],
  layout,
  onNavigate,
  onNavigateBack,
  onToggle,
  onFindAction,
  sortable
}: AttachmentDirentsProps): ReactElement {
  const entries = toDirentListEntries(!!onNavigateBack, subfolders, fileGroups);

  return (
    <div className={cn("attachment-dirents", {}, className)}>
      <AutoSizer key={entries.length}>
        {({ height, width }) => {
          const itemContent = (index: number, entry: DirentListEntry) => {
            if (entry.kind === "back") {
              return (
                <AttachmentDirentNav
                  langtag={langtag}
                  icon="folder-back"
                  layout={layout}
                  onClick={() => onNavigateBack?.()}
                />
              );
            }

            if (entry.kind === "group-header") {
              return (
                <FolderDirentGroupHeader label={entry.label} layout={layout} />
              );
            }

            return (
              <AttachmentDirent
                langtag={langtag}
                dirent={entry.dirent}
                layout={layout}
                onNavigate={onNavigate}
                width={width}
                onToggle={onToggle}
                onFindAction={onFindAction}
              />
            );
          };

          return layout === "list" ? (
            <Virtuoso
              style={{ height, width }}
              data={entries}
              increaseViewportBy={200}
              context={{ entries, sortable }}
              components={{ List: List, Item: ListItem }}
              itemContent={itemContent}
            />
          ) : (
            <VirtuosoGrid
              style={{ height, width }}
              data={entries}
              increaseViewportBy={200}
              context={{ entries, sortable }}
              components={{ List: Grid, Item: GridItem }}
              itemContent={itemContent}
            />
          );
        }}
      </AutoSizer>
    </div>
  );
}
