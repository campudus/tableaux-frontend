import { ReactElement, useRef, useState } from "react";
import f from "lodash/fp";
import GrudHeader from "../GrudHeader";
import { switchLanguageHandler } from "../Router";
import { useSelector } from "react-redux";
import { Column, GRUDStore } from "../../types/grud";
import store from "../../redux/store";
import actions from "../../redux/actionCreators";
import PreviewRowView from "./PreviewRowView";
import PreviewDetailView from "./PreviewDetailView";

type PreviewViewProps = {
  langtag: string;
  tableId: number;
  rowId: number;
  columnId: number | undefined;
};

export default function PreviewView({
  langtag,
  tableId,
  rowId,
  columnId
}: PreviewViewProps): ReactElement {
  const [leftWidth, setLeftWidth] = useState(50);
  const isDragging = useRef(false);

  const columns = useSelector(
    tableId !== undefined
      ? f.prop(["columns", tableId, "data"])
      : () => undefined
  ) as Column[] | undefined;

  const row = useSelector((store: GRUDStore) => {
    if (f.isNil(tableId) || f.isNil(rowId)) return undefined;
    return store.rows[tableId]?.data.find(row => row.id === rowId);
  });

  // if (columnId) {
  //   const column = columns?.find(c => c.id === columnId);

  //   if (column?.kind === "link") {
  //     console.log(" loading link column data", column.toTable);
  //     store.dispatch(actions.loadColumns(column.toTable));
  //     store.dispatch(actions.loadAllRows(column.toTable));
  //   }
  // }

  console.log({ columns, row });

  const handleLanguageSwitch = (newLangtag: string) => {
    switchLanguageHandler(history, newLangtag);
  };

  const handleMouseDown = () => {
    isDragging.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;

    const container = document.getElementById("resizable-container");
    if (!container) return;
    const containerWidth = container.offsetWidth;
    const newLeftWidth = (e.clientX / containerWidth) * 100;

    if (newLeftWidth < 20 || newLeftWidth > 80) return;

    setLeftWidth(newLeftWidth);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <>
      <GrudHeader
        langtag={langtag}
        handleLanguageSwitch={handleLanguageSwitch}
      />

      <div
        id="resizable-container"
        className="preview-view"
        style={{ userSelect: "none" }}
      >
        <div
          className="preview-view__resizeable-left"
          style={{ width: `${leftWidth}%` }}
        >
          <PreviewRowView
            langtag={langtag}
            tableId={tableId}
            columns={columns}
            row={row}
          />
        </div>

        <div
          className="preview-view__resizeable-right"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <div
            onMouseDown={handleMouseDown}
            className="preview-view__resizer"
          />

          <PreviewDetailView />
        </div>
      </div>
    </>
  );
}
