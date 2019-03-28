import { compose, withProps } from "recompose";
import React from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { ColumnKinds } from "../../constants/TableauxConstants";
import { doto } from "../../helpers/functools";
import {
  getColumnDisplayName,
  retrieveTranslation
} from "../../helpers/multiLanguage";
import { isCell } from "../../specs/cell-spec";
import { withForeignDisplayValues } from "../helperComponents/withForeignDisplayValues";
import Empty from "../helperComponents/emptyEntry";
import RowConcat from "../../helpers/RowConcatHelper";
import store from "../../redux/store";

const OverlayHeadRowIdentificator = props => {
  const {
    cell,
    cell: { row, column },
    langtag,
    foreignDisplayValues,
    columnDisplayName
  } = props;
  if (!cell) {
    return null;
  }

  const isConcatCell =
    !f.isNil(foreignDisplayValues) && column.kind === ColumnKinds.concat;
  const isLinkCell =
    !f.isNil(foreignDisplayValues) && column.kind === ColumnKinds.link;
  const concatValue = isConcatCell ? (
    foreignDisplayValues
  ) : isLinkCell ? (
    foreignDisplayValues.map(retrieveTranslation(langtag)).join(" ")
  ) : (
    <RowConcat row={row} langtag={langtag} idColumn={column} />
  );

  return (
    <span>
      <span className="column-name">
        {columnDisplayName}
        {f.any(f.isEmpty, [columnDisplayName, concatValue]) ? "" : ": "}
      </span>
      {f.isString(concatValue) ? (
        <span className="row-concat-string">{concatValue}</span>
      ) : (
        concatValue
      )}
    </span>
  );
};

OverlayHeadRowIdentificator.propTypes = {
  cell: PropTypes.object,
  langtag: PropTypes.string.isRequired
};

const setupIdProps = withProps(({ cell, title, langtag }) => {
  const cellOrTitle = isCell(cell) ? cell : isCell(title) ? title : null;
  if (!cellOrTitle) {
    return <Empty />;
  }

  console.log({ cell, title });

  const state = store.getState();
  const { table, column, row } = cellOrTitle;
  const columnDisplayName =
    column.kind === ColumnKinds.concat
      ? null
      : getColumnDisplayName(cellOrTitle.column, langtag);
  const firstColumn = f.prop(["columns", table.id, "data", 0], state);
  const liveRow = doto(
    state,
    f.prop(["rows", table.id, "data"]),
    f.find(f.propEq("id", row.id))
  );

  return firstColumn.id === column.id
    ? {
        cell: cellOrTitle,
        columnDisplayName
      }
    : {
        columnDisplayName,
        cell: {
          ...f.first(row.cells),
          value: f.first(row.values),
          row: liveRow
        }
      };
});

export default compose(
  setupIdProps,
  withForeignDisplayValues
)(OverlayHeadRowIdentificator);
