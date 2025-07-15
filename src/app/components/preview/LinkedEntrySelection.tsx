import { CellValue } from "@grud/devtools/types";
import { ReactElement, useCallback } from "react";
import Chip from "../Chip/Chip";
import { useSelector, useDispatch } from "react-redux";
import { GRUDStore, Column } from "../../types/grud";
import actionTypes from "../../redux/actionTypes";
import getDisplayValue from "../../helpers/getDisplayValue";

type LinkedEntrySelectionProps = {
  langtag: string;
  linkedEntriesColumn: Column;
  linkedEntries: (CellValue & {
    id: number;
  })[];
};

export default function LinkedEntrySelection({
  langtag,
  linkedEntriesColumn,
  linkedEntries
}: LinkedEntrySelectionProps): ReactElement {
  const dispatch = useDispatch();
  const selectedIds = useSelector(
    (store: GRUDStore) => store.preview.selectedLinkedEntries
  );

  const handleClick = useCallback(
    (id: number) => {
      dispatch({
        type: actionTypes.preview.PREVIEW_SET_LINKED_SELECTION,
        selectedLinkedEntries: selectedIds?.includes(id)
          ? selectedIds.filter(x => x !== id)
          : [...(selectedIds ?? []), id]
      });
    },
    [dispatch, selectedIds]
  );

  let values = getDisplayValue(linkedEntriesColumn)(linkedEntries);
  if (Array.isArray(values)) {
    values = values.map(v => v[langtag]);
  } else {
    values = values[langtag];
  }

  return (
    <div className="linked-entry-selection">
      {linkedEntries.map((entry, index) => {
        const isActive = selectedIds?.includes(entry.id);

        return (
          <Chip
            key={entry.id}
            className="linked-entry-selection__chip"
            label={values.at(index)}
            onClick={() => handleClick(entry.id)}
            isActive={isActive}
          />
        );
      })}
    </div>
  );
}
