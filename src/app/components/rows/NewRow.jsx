import React from "react";
import PropTypes from "prop-types";
import { translate } from "react-i18next";
import {
  compose,
  pure,
  withHandlers,
  setPropTypes,
  renderNothing,
  branch
} from "recompose";
import f from "lodash/fp";

const withFunctionality = compose(
  pure,
  setPropTypes({
    showToast: PropTypes.func,
    rows: PropTypes.array,
    onAdd: PropTypes.func
  }),
  translate(["table"]),
  withHandlers({
    addNewRow: props => () => {
      const { t, showToast, rows, onAdd } = props;
      const isEmpty = f.cond([
        [
          f.isArray,
          element => f.isEmpty(element) || f.every(f.isEmpty, element)
        ],
        [f.isNumber, f.stubFalse],
        [f.stubTrue, f.isEmpty]
      ]);
      const hasEmptyRow = f.every(isEmpty, f.prop("values", f.last(rows)));
      if (f.isEmpty(rows) || !hasEmptyRow) {
        onAdd();
        return;
      }
      showToast({
        content: <div id="cell-jump-toast">{t("table:cant-add-row")}</div>,
        duration: 2000
      });
    }
  })
);

// By extracting the row button, we make sure an empty cell with proper CSS gets rendered in settings tables
const RowButton = branch(
  props => f.getOr(false, ["table", "type"], props) === "settings",
  renderNothing
)(({ t, addNewRow }) => (
  <a href="#" className="button new-row-inner" onClick={addNewRow}>
    <i className="fa fa-plus-circle" />
    <span>{t("add_new_row")}</span>
  </a>
));

const NewRowButton = props => {
  const { t, addNewRow, table } = props;
  return (
    <div className="new-row">
      <RowButton t={t} addNewRow={addNewRow} table={table} />
    </div>
  );
};

export default withFunctionality(NewRowButton);
