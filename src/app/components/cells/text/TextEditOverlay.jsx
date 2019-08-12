import React from "react";
import { compose, lifecycle, withStateHandlers } from "recompose";
import i18n from "i18next";

const TextEditOverlay = props => {
  const { editedValue, setValue, saveEdits } = props;

  return (
    <div className="content-items richtext-cell-editor">
      <div className="item">
        <div className="item-content shorttext" tabIndex={1}>
          <textarea
            value={editedValue}
            placeholder={i18n.t("table:empty.text")}
            onChange={setValue}
            onBlur={saveEdits}
          />
        </div>
      </div>
    </div>
  );
};

const enhance = compose(
  withStateHandlers(
    ({ cell, value, langtag }) => ({
      editedValue: cell.column.multilanguage ? value[langtag] : value
    }),
    {
      setValue: () => event => ({ editedValue: event.target.value }),
      saveEdits: (state, props) => () => {
        const { editedValue } = state;
        const { langtag, cell, value, actions } = props;
        const { column, row, table } = cell;

        const newValue = column.multilanguage
          ? { [langtag]: editedValue }
          : editedValue;

        actions.changeCellValue({
          oldValue: value,
          newValue,
          tableId: table.id,
          columnId: column.id,
          rowId: row.id,
          cell
        });
      }
    }
  ),
  lifecycle({
    componentWillUnmount() {
      this.props.saveEdits();
    }
  })
);

export default enhance(TextEditOverlay);
