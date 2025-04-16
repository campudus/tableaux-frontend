import f from "lodash/fp";
import i18n from "i18next";
import { AutoSizer, List } from "react-virtualized";
import { ReactElement, useEffect, useState } from "react";
import {
  Attachment,
  FileDependentRow,
  FileDependentRowItem
} from "../../../types/grud";
import { makeRequest } from "../../../helpers/apiHelper";
import { toFileDependents } from "../../../helpers/apiRoutes";
import Spinner from "../../header/Spinner";
import {
  getColumnDisplayName,
  getTableDisplayName,
  retrieveTranslation
} from "../../../helpers/multiLanguage";
import SvgIcon from "../../helperComponents/SvgIcon";
import { buildClassName as cn } from "../../../helpers/buildClassName";
import getDisplayValue from "../../../helpers/getDisplayValue";

type FileDependentsProps = {
  langtag: string;
  file: Attachment;
};

export default function FileDependentsBody({
  langtag,
  file
}: FileDependentsProps): ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const [dependentRows, setDependentRows] = useState<FileDependentRow[]>([]);

  const loadDependentRows = async () => {
    const apiRoute = toFileDependents(file.uuid);

    setIsLoading(true);

    try {
      const response = await makeRequest({ apiRoute });
      setDependentRows(response.dependentRows);
    } catch (error) {
      console.error("Error loading file dependents: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDependentRows();
  }, []);

  if (isLoading) {
    return (
      <div className="file-dependents__loading">
        <Spinner isLoading={true} />
        <p>{i18n.t("media:load_dependent_rows")}</p>
      </div>
    );
  }

  return (
    <div className="file-dependents__tables content-items">
      {dependentRows.map(({ table, column, rows }) => (
        <FileDependentsTable
          key={table.id}
          langtag={langtag}
          table={table}
          column={column}
          rows={rows}
        />
      ))}
    </div>
  );
}

function FileDependentsTable({
  langtag,
  table,
  column: idColumn,
  rows
}: FileDependentRow & { langtag: string }) {
  const rowItemsByColId = f.groupBy(({ toColumn: { id } }) => id, rows);
  const toColumns = f.uniqBy("id", f.map("toColumn", rows));
  const tableName = getTableDisplayName(table, langtag);
  const rowIds = rows.map(({ row }) => row.id);
  const rowCount = rowIds.length;
  const rowFilter = `filter:id:${f.uniq(rowIds).join(":")}`;
  const firstRowId = rowIds.at(0);
  const firstColId = toColumns.at(0)?.id;
  const tableUrl = `/${langtag}/tables/${table.id}`;
  const rowUrl = `${tableUrl}/columns/${firstColId}/rows/${firstRowId}?${rowFilter}`;

  return (
    <div className="file-dependents-table item">
      <div className="file-dependents-table__headers">
        <a
          className="file-dependents-table__header item-header"
          href={tableUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {tableName}
          <SvgIcon icon="tablelink" containerClasses="color-primary" />
        </a>

        <a
          className="file-dependents-table__header item-header"
          href={rowUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {rowCount > 1
            ? i18n.t("media:show_dependent_rows", { count: rowCount })
            : i18n.t("media:show_dependent_row", { count: rowCount })}
        </a>
      </div>

      <div className="file-dependents-table__columns">
        {toColumns.map(toColumn => (
          <FileDependentsTableColumn
            key={toColumn.id}
            langtag={langtag}
            table={table}
            column={idColumn}
            rows={rowItemsByColId[toColumn.id]}
            toColumn={toColumn}
          />
        ))}
      </div>
    </div>
  );
}

function FileDependentsTableColumn({
  langtag,
  table,
  column: idColumn,
  rows,
  toColumn
}: { langtag: string } & FileDependentRow &
  Pick<FileDependentRowItem, "toColumn">) {
  const [expanded, setExpanded] = useState(false);
  const columnName = getColumnDisplayName(toColumn, langtag);
  const maxRowCount = expanded ? rows.length : 4;
  const rowCount = Math.min(rows.length, maxRowCount);

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="file-dependents-table-column">
      <div className="file-dependents-table-column__header">{columnName}</div>

      <div className={cn("file-dependents-table-column__rows", { expanded })}>
        <AutoSizer disableHeight>
          {({ width }) => (
            <List
              height={Math.min(rowCount * 44, 220)}
              width={width}
              rowHeight={44}
              rowCount={rowCount}
              rowRenderer={({ index, style }) => {
                const { row, toColumn } = rows[index];

                return (
                  <div key={row.id} style={style}>
                    <FileDependentsTableRow
                      langtag={langtag}
                      table={table}
                      column={idColumn}
                      rows={rows}
                      row={row}
                      toColumn={toColumn}
                    />
                  </div>
                );
              }}
            />
          )}
        </AutoSizer>
      </div>

      {rows.length > 4 && (
        <button
          className="file-dependents-table-column__expand"
          onClick={handleToggleExpanded}
        >
          <i className={expanded ? "fa fa-angle-up" : "fa fa-angle-down"} />
          {expanded
            ? i18n.t("media:show_less")
            : i18n.t("media:show_all", { count: rows.length })}
        </button>
      )}
    </div>
  );
}

function FileDependentsTableRow({
  langtag,
  table,
  column: idColumn,
  row,
  toColumn
}: { langtag: string } & FileDependentRow & FileDependentRowItem) {
  const idValue = row.values.at(0);
  const rowDpV = getDisplayValue(idColumn)(idValue);
  const rowName = f.isArray(rowDpV)
    ? rowDpV.map(retrieveTranslation(langtag)).join(" ")
    : retrieveTranslation(langtag)(rowDpV);
  const tableUrl = `/${langtag}/tables/${table.id}`;
  const rowUrl = `${tableUrl}/columns/${toColumn.id}/rows/${row.id}`;

  return (
    <a
      className="file-dependents-table-row"
      href={rowUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>{rowName}</span>
      <i className="icon fa fa-external-link" />
    </a>
  );
}
