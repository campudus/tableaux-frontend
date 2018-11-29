import React from "react";
import PropTypes from "prop-types";
// import ActionCreator from "../../actions/ActionCreator";
import {translate} from "react-i18next";
import {compose, pure, withHandlers, setPropTypes, renderNothing, branch} from "recompose";
import f from "lodash/fp";

const withFunctionality = compose(
  pure,
  setPropTypes(
    {
      table: PropTypes.object.isRequired,
      onAdd: PropTypes.func
    }
  ),
  withHandlers(
    {
      addNewRow: (props) => () => {
        const tableId = props.table.getId();
        // ActionCreator.addRow(tableId, props.onAdd);
      }
    }
  ),
  translate(["table"])
);

// By extracting the row button, we make sure an empty cell with proper CSS gets rendered in settings tables
const RowButton = branch(
  (props) => f.getOr(false, ["table", "type"], props) === "settings",
  renderNothing
)(
  ({t, addNewRow}) => (
    <a href="#" className="button new-row-inner" onClick={addNewRow}>
      <i className="fa fa-plus-circle" />
      <span>{t("add_new_row")}</span>
    </a>
  )
);

const NewRowButton = (props) => {
  const {t, addNewRow, table} = props;
  return (
    <div className="new-row">
      <RowButton t={t}
                 addNewRow={addNewRow}
                 table={table}
      />
    </div>
  );
};

export default withFunctionality(NewRowButton);
