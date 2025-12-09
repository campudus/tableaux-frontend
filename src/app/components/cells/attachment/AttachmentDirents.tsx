import { ReactElement } from "react";
import { AutoSizer } from "react-virtualized";
import { Virtuoso, VirtuosoGrid } from "react-virtuoso";
import { Attachment, Folder, FolderID } from "../../../types/grud";
import { buildClassName as cn } from "../../../helpers/buildClassName";
import { Layout, ToggleAction } from "./AttachmentOverlay";
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
  subfolders = [],
  layout,
  onNavigate,
  onNavigateBack,
  onToggle,
  onFindAction,
  sortable
}: AttachmentDirentsProps): ReactElement {
  const dirents = [
    // add dummy folder for back action
    ...(onNavigateBack ? [{} as Folder] : []),
    ...subfolders,
    ...files
  ];

  return (
    <div className={cn("attachment-dirents", {}, className)}>
      <AutoSizer key={dirents.length}>
        {({ height, width }) => {
          const itemContent = (index: number, dirent: Folder | Attachment) => {
            if (onNavigateBack && index === 0) {
              return (
                <AttachmentDirentNav
                  langtag={langtag}
                  icon="folder-back"
                  layout={layout}
                  onClick={onNavigateBack}
                />
              );
            }

            return (
              <AttachmentDirent
                index={index}
                langtag={langtag}
                dirent={dirent}
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
              data={dirents}
              increaseViewportBy={200}
              context={{ dirents, sortable }}
              components={{ List: List, Item: ListItem }}
              itemContent={itemContent}
            />
          ) : (
            <VirtuosoGrid
              style={{ height, width }}
              data={dirents}
              increaseViewportBy={200}
              context={{ dirents, sortable }}
              components={{ List: Grid, Item: GridItem }}
              itemContent={itemContent}
            />
          );
        }}
      </AutoSizer>
    </div>
  );
}
