import React from "react";
import { compose, lifecycle, withStateHandlers } from "recompose";
import i18n from "i18next";
import { columnHasMaxLength, columnHasMinLength, isTextTooShort, isTextTooLong, getTextLength } from "../../../helpers/limitTextLength";

const TextEditOverlay = props => {
  const { editedValue, setValue, saveEdits, readOnly, cell: { column } } = props;
  const { minLength, maxLength } = column
  const [clickedOutside, setClickedOutside] = React.useState(false);
  const minLengthText = columnHasMinLength(column) ? i18n.t("table:text-length:min-length-full", { minLength }) : ""
  const maxLengthText = columnHasMaxLength(column) ? `${getTextLength(editedValue)}/${maxLength}` : ""
  const textTooShort = isTextTooShort(column, editedValue)
  const shouldCatchOutsideClick = textTooShort
  const errorCssClass = (clickedOutside && textTooShort) ? "markdown-editor_error" : ""
  const onOutsideClick = evt => {
    setClickedOutside(true);
    evt.stopPropagation();
    evt.preventDefault();
  }
  const onChange = (evt) => {
    setClickedOutside(false)
    const value = evt.target.value
    if (isTextTooLong(column, value)) {
      return
    }
    setValue(evt)
  }
  const onBlur = () => {
    if (shouldCatchOutsideClick) {
      return
    }
    saveEdits()
  }
  return (
    <div className="content-items richtext-cell-editor">
      <div className="item">
        {shouldCatchOutsideClick && (<div className="catchOutsideClick" onClick={onOutsideClick} />)}
        <div className="item-content shorttext textarea_wrapper" tabIndex={1}>
          <textarea
            className={errorCssClass}
            disabled={!!readOnly}
            value={editedValue}
            placeholder={i18n.t("table:empty.text")}
            onChange={onChange}
            onBlur={onBlur}
          />
        </div>
        <div className="length-limits" >
          <div className={`min-length ${errorCssClass}`}>{minLengthText} </div>
          <div className="max-length">{maxLengthText} </div>
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
