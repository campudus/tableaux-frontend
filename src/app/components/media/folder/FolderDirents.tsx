import f from "lodash/fp";
import i18n from "i18next";
import { useHistory } from "react-router-dom";
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

type FolderDirentsProps = {
  className?: string;
  langtag: string;
  folder: Partial<Folder>;
  fileIdsDiff: string[];
  layout: Layout;
};

export default function FolderDirents({
  className,
  langtag,
  folder,
  fileIdsDiff,
  layout
}: FolderDirentsProps): ReactElement {
  const history = useHistory();
  const [dimensions, setDimensions] = useState({ width: 100, height: 100 });
  const masonryRef = useRef<Masonry>(null);
  const isRoot = folder.id === null;
  const hasBack = !isRoot;
  const files = f.orderBy(f.prop("updatedAt"), "desc", folder.files);
  // sort new folder to top
  const subfolders = f.orderBy(
    folder => folder.name === i18n.t("media:new_folder"),
    "desc",
    folder.subfolders ?? []
  );
  // add dummy folder for back action
  const dirents = [...(hasBack ? [{} as Folder] : []), ...subfolders, ...files];

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
    switchFolderHandler(history, langtag, folder.parentId);
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
  }, [dirents.length, layout, dimensions]);

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
              cellCount={dirents.length}
              cellMeasurerCache={cellMeasurerCache}
              cellPositioner={cellPositioner}
              cellRenderer={({ index, key, parent, style }) => {
                const dirent = dirents[index];

                return (
                  <CellMeasurer
                    key={key}
                    index={index}
                    parent={parent}
                    cache={cellMeasurerCache}
                  >
                    {hasBack && index === 0 ? (
                      <FolderDirentNav
                        style={{ ...style, width: cellWidth }}
                        langtag={langtag}
                        label=".."
                        layout={layout}
                        onClick={handleNavigateBack}
                      />
                    ) : dirent ? (
                      <FolderDirent
                        style={{ ...style, width: cellWidth }}
                        langtag={langtag}
                        dirent={dirent}
                        layout={layout}
                        fileIdsDiff={fileIdsDiff}
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
