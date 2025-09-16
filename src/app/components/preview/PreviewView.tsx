import { ReactElement, useRef, useState, useEffect } from "react";
import f from "lodash/fp";
import GrudHeader from "../GrudHeader";
import { switchLanguageHandler } from "../Router";
import { useSelector, useDispatch } from "react-redux";
import { GRUDStore, Row } from "../../types/grud";
import actions from "../../redux/actionCreators";
import PreviewRowView from "./PreviewRowView";
import PreviewDetailView from "./PreviewDetailView";
import Spinner from "../header/Spinner";
import actionTypes from "../../redux/actionTypes";
import { ColumnAndRow, combineColumnsAndRow } from "./helper";
import { useHistory } from "react-router-dom";
import { getDefaultSelectedColumnId } from "./attributes";
import SvgIcon from "../helperComponents/SvgIcon";
import i18n from "i18next";

type RowViewProps = {
  langtag: string;
  tableId: number;
  rowId: number;
  columnId: number | undefined;
  row: Row | undefined;
  columnsAndRow: ColumnAndRow[];
};

const RowView = ({
  langtag,
  tableId,
  rowId,
  columnId,
  row,
  columnsAndRow
}: RowViewProps) => {
  if (!row) {
    return (
      <div className="preview-view__centered">
        {i18n.t("preview:error_no_row_found", { rowId, tableId })}
      </div>
    );
  }
  if (f.isEmpty(columnsAndRow)) {
    return (
      <div className="preview-view__centered">
        {i18n.t("preview:error_no_data")}
      </div>
    );
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

type DetailViewProps = {
  langtag: string;
  tableId: number;
  columnId: number | undefined;
  currentDetailTable: number | null;
  columnsAndRow: ColumnAndRow[];
  detailTableColumnsMeta: GRUDStore["columns"][number] | undefined;
};

const DetailView = ({
  langtag,
  tableId,
  columnId,
  currentDetailTable,
  columnsAndRow,
  detailTableColumnsMeta
}: DetailViewProps) => {
  if (detailTableColumnsMeta && !detailTableColumnsMeta.finishedLoading) {
    return <Spinner isLoading />;
  }

  if (detailTableColumnsMeta?.error) {
    return (
      <div className="preview-view__centered">
        {i18n.t("preview:error_loading_data")}
      </div>
    );
  }

  if (!columnId) {
    console.warn("No column found or selected for the detail view.");
    return null;
  }

  if (f.isEmpty(columnsAndRow)) {
    console.warn("No data found.");
    return null;
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
  const [leftWidth, setLeftWidth] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

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
    const column = columns?.find(c => c.id === columnId);

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

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;

    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const newLeftWidth = (e.clientX / containerWidth) * 100;

    setLeftWidth(f.clamp(20, 80, newLeftWidth));
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
        ref={containerRef}
        className="preview-view"
        style={{ userSelect: isDragging.current ? "none" : "auto" }}
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
              <RowView
                langtag={langtag}
                tableId={tableId}
                rowId={rowId}
                columnId={columnId}
                row={row}
                columnsAndRow={columnsAndRow}
              />
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

              <DetailView
                langtag={langtag}
                tableId={tableId}
                columnId={columnId}
                currentDetailTable={currentDetailTable}
                columnsAndRow={columnsAndRow}
                detailTableColumnsMeta={detailTableColumnsMeta}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
