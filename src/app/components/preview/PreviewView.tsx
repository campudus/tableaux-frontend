import { ReactElement, useRef, useState, useEffect } from "react";
import f from "lodash/fp";
import GrudHeader from "../GrudHeader";
import { switchLanguageHandler } from "../Router";
import { useSelector, useDispatch } from "react-redux";
import { GRUDStore } from "../../types/grud";
import actions from "../../redux/actionCreators";
import PreviewRowView from "./PreviewRowView";
import PreviewDetailView from "./PreviewDetailView";
import Spinner from "../header/Spinner";
import actionTypes from "../../redux/actionTypes";
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

  const columnsMeta = useSelector((store: GRUDStore) => store.columns[tableId]);
  const columns = columnsMeta?.data;

  const rowMeta = useSelector((store: GRUDStore) => store.rows[tableId]);
  const row = rowMeta?.data.find(row => row.id === rowId);

  const loadingData =
    !columnsMeta ||
    !rowMeta ||
    columnsMeta?.finishedLoading === false ||
    rowMeta?.finishedLoading === false;

  const columnsAndRow = combineColumnsAndRow(columns, row);
  const columnId =
    useSelector((store: GRUDStore) => store.preview.currentColumn) ??
    getDefaultSelectedColumnId(columnsAndRow);

  const currentDetailTable = useSelector(
    (store: GRUDStore) => store.preview.currentDetailTable
  );
  const detailTableColumnsMeta = useSelector((store: GRUDStore) =>
    currentDetailTable ? store.columns[currentDetailTable] : undefined
  );

  useEffect(() => {
    if (!columnId || !columns) return;

    const column = columns.find(c => c.id === columnId);

    if (column?.kind === "link") {
      if (column.toTable !== currentDetailTable) {
        dispatch({
          type: actionTypes.preview.PREVIEW_SET_CURRENT_DETAIL_TABLE,
          currentDetailTable: column.toTable
        });
      }
      if (!detailTableColumnsMeta?.data) {
        dispatch(actions.loadColumns(column.toTable));
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
    if (!row) {
      return <div className="preview-view__centered">No row found.</div>;
    }

    if (f.isEmpty(columnsAndRow)) {
      return <div className="preview-view__centered">No data found.</div>;
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
    if (detailTableColumnsMeta && !detailTableColumnsMeta.finishedLoading) {
      return <Spinner isLoading />;
    }

    if (detailTableColumnsMeta?.error) {
      return (
        <div className="preview-view__centered">
          Error loading data. Please try again.
        </div>
      );
    }

    if (!columnId) {
      console.warn("No column found or selected for the detail view.");
      return;
    }

    if (f.isEmpty(columnsAndRow)) {
      console.warn("No data found.");
      return;
    }

    return (
      <PreviewDetailView
        langtag={langtag}
        currentTable={tableId}
        currentColumnId={columnId}
        currentDetailTable={currentDetailTable}
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
        {loadingData ? (
          <Spinner isLoading />
        ) : columnsMeta?.error || rowMeta?.error ? (
          <div>Error loading data. Please try again.</div>
        ) : (
          <>
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
              <div
                onMouseDown={handleMouseDown}
                className="preview-view__resizer"
              >
                <SvgIcon icon={"grabber"} />
              </div>

              {renderDetailView()}
            </div>
          </>
        )}
      </div>
    </>
  );
}
