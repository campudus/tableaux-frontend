import f from "lodash/fp";
import i18n from "i18next";
import { useNavigate } from "react-router-dom";
import { ReactElement, useEffect, useMemo, useRef, useState } from "react";
import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  Masonry
} from "react-virtualized";
import { createCellPositioner } from "react-virtualized/dist/es/Masonry";
import { Folder } from "../../../types/grud";
import { buildClassName as cn } from "../../../helpers/buildClassName";
import { Layout } from "./FolderToolbar";
import FolderDirent from "./FolderDirent";
import { switchFolderHandler } from "../../Router";
import FolderDirentNav from "./FolderDirentNav";
import FolderDirentGroupHeader from "./FolderDirentGroupHeader";
import {
  arrangeAttachments,
  DEFAULT_DIRENT_ORDER,
  DirentOrder,
  sortFolders
} from "./direntOrdering";
import { toDirentListEntries } from "./direntListEntries";

type FolderDirentsProps = {
  className?: string;
  langtag: string;
  folder: Partial<Folder>;
  fileIdsDiff: string[];
  layout: Layout;
  order?: DirentOrder;
};

export default function FolderDirents({
  className,
  langtag,
  folder,
  fileIdsDiff,
  layout,
  order = DEFAULT_DIRENT_ORDER
}: FolderDirentsProps): ReactElement {
  const navigate = useNavigate();
  const [dimensions, setDimensions] = useState({ width: 100, height: 100 });
  const masonryRef = useRef<Masonry>(null);
  const isRoot = folder.id === null;
  const hasBack = !isRoot;
  const fileGroups = arrangeAttachments(order, langtag, folder.files ?? []);
  // sort new folder to top
  const subfolders = f.orderBy(
    folder => folder.name === i18n.t("media:new_folder"),
    "desc",
    sortFolders(order, folder.subfolders ?? [])
  );
  // add dummy entry for back action
  const listItems = toDirentListEntries(hasBack, subfolders, fileGroups);

  const cellHeight = layout === "list" ? 50 : 190;
  const cellWidth = layout === "list" ? dimensions.width : 215;
  const gutterSize = layout === "list" ? 0 : 10;

  const cellMeasurerCache = useMemo(() => {
    return new CellMeasurerCache({
      defaultHeight: cellHeight,
      defaultWidth: cellWidth,
      fixedWidth: true,
      fixedHeight: true
    });
  }, [layout]);

  const cellPositioner = createCellPositioner({
    cellMeasurerCache,
    columnCount: 0,
    columnWidth: cellWidth,
    spacer: gutterSize
  });

  const calculateColumnCount = () => {
    return Math.floor(dimensions.width / (cellWidth + gutterSize));
  };

  const handleNavigateBack = () => {
    switchFolderHandler(navigate, langtag, folder.parentId);
  };

  useEffect(() => {
    cellMeasurerCache.clearAll();
    cellPositioner.reset({
      columnCount: calculateColumnCount(),
      columnWidth: cellWidth,
      spacer: gutterSize
    });
    masonryRef.current?.clearCellPositions();
    masonryRef.current?.recomputeCellPositions();
  }, [listItems.length, order, layout, dimensions]);

  return (
    <div className={cn("folder-dirents", {}, className)}>
      <AutoSizer
        onResize={({ height, width }) => {
          setDimensions({ width: width - 15, height });
        }}
      >
        {({ height, width }) => {
          return (
            <Masonry
              ref={masonryRef}
              height={height}
              width={width}
              autoHeight={false}
              overscanByPixels={200}
              cellCount={listItems.length}
              cellMeasurerCache={cellMeasurerCache}
              cellPositioner={cellPositioner}
              cellRenderer={({ index, key, parent, style }) => {
                const entry = listItems[index];

                return (
                  <CellMeasurer
                    key={key}
                    index={index}
                    parent={parent}
                    cache={cellMeasurerCache}
                  >
                    {entry?.kind === "back" ? (
                      <FolderDirentNav
                        style={{ ...style, width: cellWidth }}
                        langtag={langtag}
                        icon="folder-back"
                        layout={layout}
                        onClick={handleNavigateBack}
                      />
                    ) : entry?.kind === "group-header" ? (
                      <FolderDirentGroupHeader
                        style={{ ...style, width: cellWidth }}
                        label={entry.label}
                        layout={layout}
                      />
                    ) : entry?.kind === "dirent" ? (
                      <FolderDirent
                        style={{ ...style, width: cellWidth }}
                        langtag={langtag}
                        dirent={entry.dirent}
                        layout={layout}
                        fileIdsDiff={fileIdsDiff}
                        width={width}
                      />
                    ) : (
                      <div style={{ ...style, width: cellWidth }}></div>
                    )}
                  </CellMeasurer>
                );
              }}
            />
          );
        }}
      </AutoSizer>
    </div>
  );
}
