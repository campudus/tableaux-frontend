import { ReactElement } from "react";
import i18n from "i18next";

type RowCountProps = {
  rowCount?: number;
  rowCountAll?: number;
};

export default function RowCount({
  rowCount = 0,
  rowCountAll = 0
}: RowCountProps): ReactElement {
  return (
    <div className="row-count">
      {i18n.t("header:pageTitle.row-count", { rowCount, rowCountAll })}
    </div>
  );
}
