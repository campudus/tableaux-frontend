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
import AttachmentOverlayDirent from "./AttachmentOverlayDirent";
import AttachmentOverlayDirentNav from "./AttachmentOverlayDirentNav";

type AttachmentOverlayDirentsProps = {
  className?: string;
  langtag: string;
  files?: Attachment[];
  subfolders?: Folder[];
  layout: Layout;
  onNavigate: (id?: FolderID | null) => void;
  onNavigateBack?: () => void;
};

export default function AttachmentOverlayDirents({
  className,
  langtag,
  files = [],
  subfolders = [],
  layout,
  onNavigate,
  onNavigateBack
}: AttachmentOverlayDirentsProps): ReactElement {
  const [dimensions, setDimensions] = useState({ width: 100, height: 100 });
  const masonryRef = useRef<Masonry>(null);
  // add dummy folder for back action
  const dirents = [
    ...(onNavigateBack ? [{} as Folder] : []),
    ...subfolders,
    ...files
  ];

  const cellHeight = layout === "list" ? 50 : 100;
  const cellWidth = layout === "list" ? dimensions.width : 130;
  const gutterSize = layout === "list" ? 0 : 6;

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
    <div className={cn("attachment-overlay-dirents", {}, className)}>
      <AutoSizer
        key={dirents.length}
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
                      <AttachmentOverlayDirentNav
                        style={{ ...style, width: cellWidth }}
                        langtag={langtag}
                        icon="folder-back"
                        layout={layout}
                        onClick={onNavigateBack}
                      />
                    ) : dirent ? (
                      <AttachmentOverlayDirent
                        style={{ ...style, width: cellWidth }}
                        langtag={langtag}
                        dirent={dirent}
                        layout={layout}
                        onNavigate={onNavigate}
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
