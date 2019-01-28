import React from "react";
import PropTypes from "prop-types";
import {
  compose,
  lifecycle,
  pure,
  withHandlers,
  withStateHandlers
} from "recompose";
import f from "lodash/fp";
import i18n from "i18next";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";

const enhance = compose(
  pure,
  withStateHandlers(
    ({ value, cell, langtag }) => {
      const oldValue = f.prop(["column", "multilanguage"], cell)
        ? value[langtag]
        : value;
      return {
        oldValue,
        value: oldValue
      };
    },
    {
      registerInput: (state, { funcs }) => node => {
        funcs.register(node);
      },
      handleChange: () => event => ({ value: event.target.value }),
      saveChanges: ({ value, oldValue }, { actions, cell, langtag }) => () => {
        const newValue = cell.column.multilanguage
          ? { [langtag]: value }
          : value;
        actions.changeCellValue({
          tableId: cell.table.id,
          columnId: cell.column.id,
          rowId: cell.row.id,
          oldValue,
          newValue
        });
      }
    }
  ),
  withHandlers({
    getKeyboardShortcuts: ({ saveChanges }) => () => {
      const captureEventAnd = fn => event => {
        event.stopPropagation();
        event.preventDefault();
        (fn || function() {})(event);
      };

      return {
        escape: captureEventAnd(saveChanges),
        enter: captureEventAnd(saveChanges)
      };
    }
  }),
  lifecycle({
    componentWillUnmount() {
      this.props.saveChanges();
    }
  })
);

const ShortTextView = ({
  value,
  registerInput,
  handleChange,
  thisUserCantEdit,
  children,
  getKeyboardShortcuts,
  saveChanges
}) => (
  <div className="item-content shorttext" tabIndex={1}>
    <input
      type="text"
      ref={registerInput}
      disabled={thisUserCantEdit}
      value={value}
      placeholder={i18n.t("table:empty.text")}
      onChange={handleChange}
      onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(
        getKeyboardShortcuts
      )}
      onBlur={saveChanges}
    />
    {children}
  </div>
);

export default enhance(ShortTextView);

ShortTextView.propTypes = {
  cell: PropTypes.object.isRequired,
  value: PropTypes.string,
  langtag: PropTypes.string.isRequired,
  thisUserCantEdit: PropTypes.bool
};
