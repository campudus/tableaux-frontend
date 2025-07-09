import { ReactElement, useRef, useState, useEffect } from "react";
import f from "lodash/fp";
import GrudHeader from "../GrudHeader";
import { switchLanguageHandler } from "../Router";
import { useSelector, useDispatch } from "react-redux";
import { Column, GRUDStore } from "../../types/grud";
import actions from "../../redux/actionCreators";
import PreviewRowView from "./PreviewRowView";
import PreviewDetailView from "./PreviewDetailView";
import Spinner from "../header/Spinner";
import actionTypes from "../../redux/actionTypes";
import { loadAllRows } from "../../redux/actions/rowActions";

type PreviewViewProps = {
  langtag: string;
  tableId: number;
  rowId: number;
};

export default function PreviewView({
  langtag,
  tableId,
  rowId
}: PreviewViewProps): ReactElement {
  const dispatch = useDispatch();
  const [leftWidth, setLeftWidth] = useState(50);
  const isDragging = useRef(false);

  const columns = useSelector(
    tableId !== undefined
      ? f.prop(["columns", tableId, "data"])
      : () => undefined
  ) as Column[] | undefined;
  const filteredColumns = columns?.filter(column => column.id !== 0);

  const row = useSelector((store: GRUDStore) => {
    if (f.isNil(tableId) || f.isNil(rowId)) return undefined;
    return store.rows[tableId]?.data.find(row => row.id === rowId);
  });

  const currentColumn =
    useSelector((store: GRUDStore) => store.preview.currentColumn) ??
    filteredColumns?.find(c => c.kind === "link")?.id;

  const currentDetailTable = useSelector(
    (store: GRUDStore) => store.preview.currentDetailTable
  );

  useEffect(() => {
    if (currentColumn) {
      const column = columns?.find(c => c.id === currentColumn);

      if (column?.kind === "link") {
        dispatch(actions.loadColumns(column.toTable));
        dispatch(loadAllRows(column.toTable));
        dispatch({
          type: actionTypes.preview.PREVIEW_SET_CURRENT_DETAIL_TABLE,
          currentDetailTable: column.toTable
        });
      }
    }
  }, [currentColumn, columns]);

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
          {filteredColumns && row ? (
            <PreviewRowView
              langtag={langtag}
              tableId={tableId}
              currentColumn={currentColumn}
              columns={filteredColumns}
              row={row}
            />
          ) : (
            <Spinner isLoading />
          )}
        </div>

        <div
          className="preview-view__resizeable-right"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <div
            onMouseDown={handleMouseDown}
            className="preview-view__resizer"
          />

          {!currentDetailTable || !row || !currentColumn ? (
            <Spinner isLoading />
          ) : (
            <PreviewDetailView
              langtag={langtag}
              currentTable={tableId}
              currentColumn={currentColumn}
              currentRow={row}
              currentDetailTable={currentDetailTable}
            />
          )}
        </div>
      </div>
    </>
  );
}
