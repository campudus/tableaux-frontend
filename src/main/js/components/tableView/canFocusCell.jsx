import {compose, pure, withPropsOnChange, withStateHandlers} from "recompose";
import f from "lodash/fp";
import {openEntityView} from "../overlay/EntityViewOverlay";
import ActionCreator from "../../actions/ActionCreator";
import {maybe} from "../../helpers/functools";
import i18n from "i18next";

const canFocusCell = compose(
  pure,
  withStateHandlers(
    // show cell jump overlay when rowId or columnId is set on initial table load
    ({rowId, columnId}) => ({showCellJumpOverlay: !f.every(f.isNil, [rowId, columnId])}),
    {
      checkCellFocus: (state, {urlOptions, rowId, columnId, table, langtag}) => (fullyLoaded = false) => {
        const showToast = (msg) => {
          ActionCreator.showToast(
            <div id="cell-jump-toast">{msg}</div>,
            7000
          );
        };

        const focusRowId = (f.isNil(rowId)) ? f.get("id", table.rows.first()) : rowId;
        const focusColId = (f.isNil(columnId))
          ? f.get("id", table.columns.first())
          : columnId;
        const focusColIdx = f.findIndex(f.matchesProperty("id", focusColId), table.columns.models);

        // guard against faulty tables
        if (focusColIdx < 0) {
          showToast(i18n.t("table:jump.no_such_column", {col: columnId}));
          return {showCellJumpOverlay: false};
        }

        const cell = maybe(table.rows)
          .exec("get", focusRowId)
          .map(f.get("cells"))
          .exec("at", focusColIdx)
          .getOrElse(null);

        if (!f.isNil(cell)) {
          ActionCreator.toggleCellSelection(cell, true);
          if (f.get("entityView", urlOptions)) {
            const evFocus = (f.get(["entityView", "focusElement"], urlOptions)) ? cell : null;
            openEntityView(table.rows.get(focusRowId), langtag, evFocus, table.rows);
          }
          return {showCellJumpOverlay: false};
          } else if (fullyLoaded) { // still no cell after loading
          showToast(i18n.t("table:jump.no_such_row", {row: rowId}));
          return {showCellJumpOverlay: false};
        } else { // no cell but still loading
          return undefined;
        }
      }
    }
  ),
  // trace back focus of cells on browser url changes
  withPropsOnChange(["rowId", "columnId"],
    (props) => {
      const {table, rowId, columnId} = props;
      if (!f.isEmpty(f.get(["columns", "models"], table)) // will get triggered on initial load, so ignore that first call
        && (!f.isNil(columnId) || !f.isNil(rowId))
      ) {
        props.checkCellFocus();
        return props;
      }
    })
);

export default canFocusCell;
