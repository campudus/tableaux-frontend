import React from "react";
import PropTypes from "prop-types";
import ActionCreator from "../../actions/ActionCreator";
import {translate} from "react-i18next";
import {compose, pure, withHandlers, setPropTypes} from "recompose";

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
        ActionCreator.addRow(tableId, props.onAdd);
      }
    }
  ),
  translate(["table"])
);

const NewRowButton = (props) => {
  const {t, addNewRow} = props;
  return (
    <div className="new-row">
      <a href="#" className="button new-row-inner" onClick={addNewRow}>
        <i className="fa fa-plus-circle">
        </i>
        <span>{t("add_new_row")}</span>
      </a>
    </div>
  );
};

export default withFunctionality(NewRowButton);
