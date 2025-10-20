import { ReactElement, useRef, useState, useEffect } from "react";
import f from "lodash/fp";
import GrudHeader from "../GrudHeader";
import { switchLanguageHandler } from "../Router";
import { useSelector, useDispatch } from "react-redux";
import { GRUDStore, LinkColumn, Row } from "../../types/grud";
import actions from "../../redux/actionCreators";
import PreviewRowView from "./PreviewRowView";
import PreviewDetailView from "./PreviewDetailView";
import Spinner from "../header/Spinner";
import actionTypes from "../../redux/actionTypes";
import {
  ColumnAndRow,
  combineColumnsAndRow,
  getPreviewDefaultTitle
} from "./helper";
import { useHistory } from "react-router-dom";
import { getDefaultSelectedColumnId } from "./attributes";
import SvgIcon from "../helperComponents/SvgIcon";
import i18n from "i18next";
import { PreviewDefaultTitle } from "./PreviewTitle";

type RowViewProps = {
  langtag: string;
  tableId: number;
  rowId: number;
  columnId: number | undefined;
  row: Row | undefined;
  columnsAndRow: ColumnAndRow[];
  defaultTitle: PreviewDefaultTitle | undefined;
};

const RowView = ({
  langtag,
  tableId,
  rowId,
  columnId,
  row,
  columnsAndRow,
  defaultTitle
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
      defaultTitle={defaultTitle}
    />
  );
};

type DetailViewProps = {
  langtag: string;
  tableId: number;
  columnId: number | undefined;
  columnsAndRow: ColumnAndRow[];
};

const DetailView = ({
  langtag,
  tableId,
  columnId,
  columnsAndRow
}: DetailViewProps) => {
  const currentDetailTable = useSelector(
    (store: GRUDStore) => store.preview.currentDetailTable
  );
  const detailTableColumnsMeta = useSelector((store: GRUDStore) =>
    currentDetailTable ? store.columns[currentDetailTable] : undefined
  );

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
  const [isDragging, setIsDragging] = useState(false);
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
  const idOfSelectedColumn =
    useSelector((store: GRUDStore) => store.preview.currentColumn) ||
    getDefaultSelectedColumnId(columnsAndRow);

  useEffect(() => {
    let cancelled = false;
    const selectedColumnAndRow = columnsAndRow.find(
      entry => entry.column.id === idOfSelectedColumn
    );

    if (selectedColumnAndRow?.column.kind === "link") {
      const linkedRowIds: number[] =
        selectedColumnAndRow.row.values.map((r: Row) => r.id) || [];
      const toTable = (selectedColumnAndRow.column as LinkColumn).toTable;

      dispatch({
        type: actionTypes.preview.PREVIEW_SET_CURRENT_DETAIL_TABLE,
        currentDetailTable: toTable
      });
      dispatch({
        type: actionTypes.preview.PREVIEW_SET_LINKED_SELECTION,
        selectedLinkedEntries: linkedRowIds
      });

      actions
        .loadColumns(toTable)(dispatch)
        .then(() => {
          if (cancelled) return;
          linkedRowIds.forEach(id => {
            dispatch(
              actions.fetchSingleRow({
                tableId: toTable,
                selectedRowId: id
              })
            );
          });
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          console.error("Error loading columns:", err);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [columnsAndRow.join("-")]);

  const handleLanguageSwitch = (newLangtag: string) => {
    switchLanguageHandler(history, newLangtag);
  };

  const handleMouseDown = () => {
    setIsDragging(true);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const newLeftWidth = (e.clientX / containerWidth) * 100;

    setLeftWidth(f.clamp(20, 80, newLeftWidth));
  };

  const handleMouseUp = () => {
    setIsDragging(false);

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
        style={{ userSelect: isDragging ? "none" : "auto" }}
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
                columnId={idOfSelectedColumn}
                row={row}
                columnsAndRow={columnsAndRow}
                defaultTitle={getPreviewDefaultTitle(
                  langtag,
                  tableId,
                  rowId,
                  columns,
                  row
                )}
              />
            </div>

            <div
              className="preview-view__resizeable-right"
              style={{ width: `${100 - leftWidth}%` }}
            >
              <div
                className="preview-view__resizer"
                onMouseDown={handleMouseDown}
              >
                <div className="preview-view__resizer-icon">
                  <SvgIcon icon={"grabber"} />
                </div>
              </div>

              <DetailView
                langtag={langtag}
                tableId={tableId}
                columnId={idOfSelectedColumn}
                columnsAndRow={columnsAndRow}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
