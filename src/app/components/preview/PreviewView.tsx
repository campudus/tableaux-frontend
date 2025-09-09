import { ReactElement, useRef, useState, useEffect } from "react";
import f from "lodash/fp";
import GrudHeader from "../GrudHeader";
import { switchLanguageHandler } from "../Router";
import { useSelector, useDispatch } from "react-redux";
import { Cell, Column, GRUDStore, Row } from "../../types/grud";
import actions from "../../redux/actionCreators";
import PreviewRowView from "./PreviewRowView";
import PreviewDetailView from "./PreviewDetailView";
import Spinner from "../header/Spinner";
import actionTypes from "../../redux/actionTypes";
import { loadAllRows } from "../../redux/actions/rowActions";
import { combineColumnsAndRow } from "./helper";
import { useHistory } from "react-router-dom";
import { getDefaultSelectedColumnId } from "./attributes";
import SvgIcon from "../helperComponents/SvgIcon";

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

  const columnsMeta = useSelector(f.prop(["columns", tableId])) as
    | { data: Array<Column>; error: boolean; finishedLoading: boolean }
    | undefined;

  const columns = columnsMeta?.data;

  const rowMeta = useSelector(f.prop(["rows", tableId])) as
    | {
        data: Array<Row & { cells: Array<Cell> }>;
        error: boolean;
        finishedLoading: boolean;
      }
    | undefined;

  const row = rowMeta?.data.find(row => row.id === rowId);

  const columnsAndRow = combineColumnsAndRow(columns, row);

  const columnId =
    useSelector((store: GRUDStore) => store.preview.currentColumn) ??
    getDefaultSelectedColumnId(columnsAndRow);

  useEffect(() => {
    if (columnId) {
      const column = columns?.find(c => c.id === columnId);

      if (column?.kind === "link") {
        dispatch(actions.loadColumns(column.toTable));
        dispatch(loadAllRows(column.toTable, row?.archived ?? false));
        dispatch({
          type: actionTypes.preview.PREVIEW_SET_CURRENT_DETAIL_TABLE,
          currentDetailTable: column.toTable
        });
      }
    }
  }, [columnId, columns]);

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

  const renderRowView = () => {
    if (
      !columnsMeta ||
      !rowMeta ||
      columnsMeta?.finishedLoading === false ||
      rowMeta?.finishedLoading === false
    ) {
      return <Spinner isLoading />;
    }

    if (columnsMeta?.error || rowMeta?.error) {
      return <div>Error loading columns.</div>;
    }

    if (!row) {
      return <div>No row found.</div>;
    }

    if (f.isEmpty(columnsAndRow)) {
      return <div>No data found.</div>;
    }

    return (
      <PreviewRowView
        langtag={langtag}
        tableId={tableId}
        columnId={columnId}
        row={row}
        columnsAndRow={columnsAndRow}
      />
    );
  };

  const renderDetailView = () => {
    if (
      !columnsMeta ||
      !rowMeta ||
      columnsMeta?.finishedLoading === false ||
      rowMeta?.finishedLoading === false
    ) {
      return <Spinner isLoading />;
    }

    if (!columnId) {
      return <div>No column found or selected for the detail view.</div>;
    }

    if (f.isEmpty(columnsAndRow)) {
      return <div>No data found.</div>;
    }

    return (
      <PreviewDetailView
        langtag={langtag}
        currentTable={tableId}
        currentColumnId={columnId}
        selectedColumnAndRow={columnsAndRow.find(
          entry => entry.column.id === columnId
        )}
      />
    );
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
          {renderRowView()}
        </div>

        <div
          className="preview-view__resizeable-right"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <div onMouseDown={handleMouseDown} className="preview-view__resizer">
            <SvgIcon icon={"grabber"} />
          </div>

          {renderDetailView()}
        </div>
      </div>
    </>
  );
}
