import { ReactElement } from "react";
import f from "lodash/fp";
import GrudHeader from "../GrudHeader";
import { switchLanguageHandler } from "../Router";
import { useSelector } from "react-redux";
import { Column, GRUDStore } from "../../types/grud";
import store from "../../redux/store";
import actions from "../../redux/actionCreators";
import getDisplayValue from "../../helpers/getDisplayValue";
import Spinner from "../header/Spinner";

type PreviewViewProps = {
  tableId: number | undefined;
  columnId: number | undefined;
  rowId: number | undefined;
  langtag: string;
};

export default function PreviewView({
  tableId,
  columnId,
  rowId,
  langtag
}: PreviewViewProps): ReactElement {
  const columns = useSelector(
    tableId !== undefined
      ? f.prop(["columns", tableId, "data"])
      : () => undefined
  ) as Column[] | undefined;

  const row = useSelector((store: GRUDStore) => {
    if (f.isNil(tableId) || f.isNil(rowId)) return undefined;
    return store.rows[tableId]?.data.find(row => row.id === rowId);
  });

  // if (columnId) {
  //   const column = columns?.find(c => c.id === columnId);

  //   if (column?.kind === "link") {
  //     console.log(" loading link column data", column.toTable);
  //     store.dispatch(actions.loadColumns(column.toTable));
  //     store.dispatch(actions.loadAllRows(column.toTable));
  //   }
  // }

  console.log({ columns, row });

  const handleLanguageSwitch = (newLangtag: string) => {
    switchLanguageHandler(history, newLangtag);
  };

  return (
    <>
      <GrudHeader
        langtag={langtag}
        handleLanguageSwitch={handleLanguageSwitch}
      />

      <div className="preview-view">
        <h4 className="preview-view__title">PreviewCenter</h4>
        {columns && row ? (
          <table>
            <tbody>
              {columns
                ?.filter(column => column.id !== 0)
                .map(column => {
                  let value = getDisplayValue(column)(
                    row?.values.at(column.id)
                  );

                  if (Array.isArray(value))
                    value = value.map(v => v[langtag]).join(", ");
                  else {
                    value = value[langtag];
                  }

                  return (
                    <tr key={column.id}>
                      <td className="preview-view__column-name">
                        {column.displayName[langtag]}
                      </td>
                      <td className="preview-view__column-value">
                        {value || "n/a"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        ) : (
          <Spinner isLoading />
        )}
      </div>
    </>
  );
}
