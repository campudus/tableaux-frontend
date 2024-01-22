import f from "lodash/fp";
import React from "react";
import {
  changeCellValue,
  clearMultilangCell
} from "../../redux/actions/cellActions";
import store from "../../redux/store";
import { showDialog } from "./GenericOverlay";

const changeCellWithoutClear = action => {
  store.dispatch(changeCellValue({ ...action, dontClear: true }));
};

const ConfirmationMessage = ({ oldValue }) => (
  <div>
    <p>{"table.clear-cell.question"}</p>
    <p>
      {Object.entries(oldValue)
        .filter(([_, val]) => !f.isEmpty(val))
        .map(([lang, val]) => (
          <span key={lang}>
            {lang} - {val}
          </span>
        ))}
    </p>
  </div>
);

export const showClearCellDialog = action => {
  const { cell, oldValue } = action;
  const handleClearCell = () => {
    clearMultilangCell(cell);
  };
  const handleChangeCellWithoutClear = () => {
    changeCellWithoutClear(action);
  };
  showDialog({
    type: "default",
    context: "foo",
    title: "bar",
    heading: "table.clera-cell.header",
    message: <ConfirmationMessage oldValue={oldValue} />,
    buttonActions: {
      neutral: ["common.cancel", handleChangeCellWithoutClear],
      negative: ["common.delete", handleClearCell]
    }
  });
};
