import { ReactElement, ReactNode } from "react";
import f from "lodash/fp";
import i18n from "i18next";
import { Row } from "../../types/grud";

type NewRowButtonProps = {
  lastRow?: Row;
  onAdd: () => Promise<Row>;
  onSelect: (row: Row) => void;
  showToast: (toast: { content: ReactNode; duration: number }) => void;
};

export default function NewRowButton({
  showToast,
  lastRow,
  onAdd,
  onSelect
}: NewRowButtonProps): ReactElement {
  const isEmpty: (rowValues: Row["values"]) => boolean = f.cond([
    [f.isArray, element => f.isEmpty(element) || f.every(isEmpty, element)],
    [f.isNumber, f.stubFalse],
    [f.stubTrue, f.isEmpty]
  ]);

  const addNewRow = async () => {
    const hasEmptyRow = f.every(isEmpty, f.prop("values", lastRow));

    if (f.isEmpty(lastRow) || !hasEmptyRow) {
      const newRow = await onAdd();
      onSelect(newRow);
      return;
    }

    onSelect(lastRow);
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
