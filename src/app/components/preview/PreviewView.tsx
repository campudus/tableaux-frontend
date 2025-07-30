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
import { combineColumnsAndRow } from "./helper";
import { useHistory } from "react-router-dom";
import { getDefaultSelectedColumnId } from "./constants";

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
  const history = useHistory();
  const dispatch = useDispatch();
  const isDragging = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);

  const columns = useSelector(
    tableId !== undefined
      ? f.prop(["columns", tableId, "data"])
      : () => undefined
  ) as Column[] | undefined;

  const row = useSelector((store: GRUDStore) => {
    if (f.isNil(tableId) || f.isNil(rowId)) return undefined;
    return store.rows[tableId]?.data.find(row => row.id === rowId);
  });

  const columnsAndRow = combineColumnsAndRow(columns, row);

  const currentColumn =
    useSelector((store: GRUDStore) => store.preview.currentColumn) ??
    getDefaultSelectedColumnId(columnsAndRow);

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
    setDragging(true);
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
    setDragging(false);
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
        style={{ userSelect: dragging ? "none" : "auto" }}
      >
        <div
          className="preview-view__resizeable-left"
          style={{ width: `${leftWidth}%` }}
        >
          {columns && row && !f.isEmpty(columnsAndRow) ? (
            <PreviewRowView
              langtag={langtag}
              tableId={tableId}
              row={row}
              currentColumn={currentColumn}
              columnsAndRow={columnsAndRow}
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

          {currentColumn && !f.isEmpty(columnsAndRow) ? (
            <PreviewDetailView
              langtag={langtag}
              currentTable={tableId}
              currentColumnId={currentColumn}
              selectedColumnAndRow={columnsAndRow.find(
                entry => entry.column.id === currentColumn
              )}
            />
          ) : (
            <Spinner isLoading />
          )}
        </div>
      </div>
    </>
  );
}
