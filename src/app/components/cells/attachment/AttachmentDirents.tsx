import { ReactElement, useEffect, useMemo, useRef, useState } from "react";
import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  Masonry
} from "react-virtualized";
import { createCellPositioner } from "react-virtualized/dist/es/Masonry";
import { Attachment, Folder, FolderID } from "../../../types/grud";
import { buildClassName as cn } from "../../../helpers/buildClassName";
import { Layout } from "./AttachmentOverlay";
import AttachmentDirent from "./AttachmentDirent";
import AttachmentDirentNav from "./AttachmentDirentNav";

type AttachmentDirentsProps = {
  className?: string;
  langtag: string;
  files?: Attachment[];
  subfolders?: Folder[];
  layout: Layout;
  onNavigate: (id?: FolderID | null) => void;
  onNavigateBack?: () => void;
  onToggle?: (file: Attachment, action: "add" | "remove") => void;
  toggleAction?: "add" | "remove";
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
  toggleAction
}: AttachmentDirentsProps): ReactElement {
  const [dimensions, setDimensions] = useState({ width: 100, height: 100 });
  const masonryRef = useRef<Masonry>(null);
  // add dummy folder for back action
  const dirents = [
    ...(onNavigateBack ? [{} as Folder] : []),
    ...subfolders,
    ...files
  ];

  const cellHeight = layout === "list" ? 48 : 130;
  const cellWidth = layout === "list" ? dimensions.width : 200;
  const gutterSize = layout === "list" ? 3 : 6;

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
    <div className={cn("attachment-dirents", {}, className)}>
      <AutoSizer
        key={dirents.length}
        onResize={({ height, width }) => {
          // subtract width of scrollbar
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
                    {onNavigateBack && index === 0 ? (
                      <AttachmentDirentNav
                        style={{ ...style, width: cellWidth }}
                        langtag={langtag}
                        icon="folder-back"
                        layout={layout}
                        onClick={onNavigateBack}
                      />
                    ) : dirent ? (
                      <AttachmentDirent
                        style={{ ...style, width: cellWidth }}
                        langtag={langtag}
                        dirent={dirent}
                        layout={layout}
                        onNavigate={onNavigate}
                        width={width}
                        onToggle={onToggle}
                        toggleAction={toggleAction}
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
