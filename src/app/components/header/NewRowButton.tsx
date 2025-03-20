import { ReactElement, ReactNode } from "react";
import f from "lodash/fp";
import i18n from "i18next";
import { Row } from "../../types/grud";

type NewRowButtonProps = {
  rows: Row[];
  showToast: (toast: { content: ReactNode; duration: number }) => void;
  onAdd: () => void;
  sortingDesc: boolean;
};

export default function NewRowButton({
  showToast,
  rows,
  onAdd,
  sortingDesc
}: NewRowButtonProps): ReactElement {
  const isEmpty: (rowValues: Row["values"]) => boolean = f.cond([
    [f.isArray, element => f.isEmpty(element) || f.every(isEmpty, element)],
    [f.isNumber, f.stubFalse],
    [f.stubTrue, f.isEmpty]
  ]);

  const addNewRow = () => {
    const lastRow = sortingDesc ? f.first(rows) : f.last(rows);
    const hasEmptyRow = f.every(isEmpty, f.prop("values", lastRow));
    if (f.isEmpty(rows) || !hasEmptyRow) {
      onAdd();
      return;
    }
    showToast({
      content: <div id="cell-jump-toast">{i18n.t("table:cant-add-row")}</div>,
      duration: 2000
    });
  };

  return (
    <button className="button new-row-button" onClick={addNewRow}>
      <i className="fa fa-plus" />
      <span>{i18n.t("table:add_new_row")}</span>
    </button>
  );
}
