import f from "lodash/fp";
import i18n from "i18next";
import { ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { Folder } from "../../../types/grud";
import { buildClassName as cn } from "../../../helpers/buildClassName";
import { Layout } from "./FolderToolbar";
import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  Masonry
} from "react-virtualized";
import { createCellPositioner } from "react-virtualized/dist/es/Masonry";
import FolderDirent from "./FolderDirent";

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
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const masonryRef = useRef<Masonry>(null);
  const { subfolders = [], files } = folder;
  const sortedFiles = f.orderBy(f.prop("updatedAt"), "desc", files);
  // sort new folder to top
  const sortedSubfolders = f.orderBy(
    folder => folder.name === i18n.t("media:new_folder"),
    "desc",
    subfolders
  );
  const dirents = [...sortedSubfolders, ...sortedFiles];

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
                    {dirent ? (
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
