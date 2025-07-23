import { ReactElement } from "react";
import actionTypes from "../../redux/actionTypes";
import { useDispatch } from "react-redux";
import { getColumnDisplayName } from "../../helpers/multiLanguage";
import CellValueLink from "./CellValueLink";
import { buildClassName } from "../../helpers/buildClassName";
import { ColumnAndRow } from "./helper";
import { attributeKeys, isPreviewTitle } from "./constants";
import f from "lodash/fp";

const { PREVIEW_TITLE } = attributeKeys;

type PreviewRowViewProps = {
  langtag: string;
  tableId: number;
  currentColumn: number | undefined;
  columnsAndRow: ColumnAndRow[];
};

export default function PreviewRowView({
  langtag,
  tableId,
  currentColumn,
  columnsAndRow
}: PreviewRowViewProps): ReactElement {
  const dispatch = useDispatch();

  const handleColumnSelection = (columnId: number, rowId: number) => {
    const newUrl = `/${langtag}/preview/${tableId}/columns/${columnId}/rows/${rowId}`;
    window.history.replaceState({}, "", newUrl);

    dispatch({
      type: actionTypes.preview.PREVIEW_SET_CURRENT_COLUMN,
      currentColumn: columnId
    });
  };

  function getPreviewTitle(columnsAndRows: ColumnAndRow[]) {
    const previewTitles = columnsAndRows.filter(({ column }) =>
      isPreviewTitle(column)
    );

    if (previewTitles.length === 0) {
      return undefined;
    }

    const previewTitlesSorted = f.sortBy(
      item => item.column.attributes?.[PREVIEW_TITLE]?.value,
      previewTitles
    );

    return previewTitlesSorted.map(({ column, row }) => (
      <CellValueLink
        key={column.id}
        langtag={langtag}
        column={column}
        row={row}
        link={`/${langtag}/tables/${tableId}/columns/${column.id}/rows/${row.id}`}
      />
    ));
  }

  const previewTitle = getPreviewTitle(columnsAndRow);

  return (
    <div className="preview-row-view">
      {previewTitle && (
        <div className="preview-row-view__title">{previewTitle}</div>
      )}

      <table>
        <tbody>
          {columnsAndRow
            .filter(({ column }) => !isPreviewTitle(column))
            .map(({ column, row }) => {
              const columnLink = `/${langtag}/tables/${tableId}/columns/${column.id}`;
              const cellLink = `/${langtag}/tables/${tableId}/columns/${column.id}/rows/${row.id}`;

              return (
                <tr
                  key={column.id}
                  className={buildClassName("preview-row-view__row", {
                    selected: currentColumn === column.id
                  })}
                >
                  <td className="preview-row-view__column preview-row-view__column-selection">
                    {(column.kind === "link" || column.kind === "richtext") && (
                      <input
                        type="radio"
                        name="column-selection"
                        checked={currentColumn === column.id}
                        onChange={() =>
                          handleColumnSelection(column.id, row.id)
                        }
                      />
                    )}
                  </td>

                  <td className="preview-row-view__column preview-row-view__column-name">
                    <a href={columnLink}>
                      {getColumnDisplayName(column, langtag)}
                    </a>
                  </td>

                  <td className="preview-row-view__column preview-row-view__column-value">
                    <CellValueLink
                      langtag={langtag}
                      column={column}
                      row={row}
                      link={cellLink}
                    />
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
