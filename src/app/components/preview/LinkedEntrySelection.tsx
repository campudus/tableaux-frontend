import { ReactElement, useCallback } from "react";
import Chip from "../Chip/Chip";
import { useSelector, useDispatch } from "react-redux";
import { GRUDStore, Column, Row } from "../../types/grud";
import actionTypes from "../../redux/actionTypes";
import getDisplayValue from "../../helpers/getDisplayValue";

type LinkedEntrySelectionProps = {
  langtag: string;
  linkedEntriesColumn: Column;
  linkedEntries: Row[];
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

  const displayValues = getDisplayValue(linkedEntriesColumn, linkedEntries);
  const values = Array.isArray(displayValues)
    ? displayValues.map(v => v[langtag])
    : displayValues[langtag];

  return (
    <div className="linked-entry-selection">
      {linkedEntries.map((entry, index) => {
        const isActive = selectedIds?.includes(entry.id);

        return (
          <Chip
            key={entry.id}
            className="linked-entry-selection__chip"
            icon={entry.archived && <i className="fa fa-archive" />}
            label={values.at(index)}
            onClick={() => handleClick(entry.id)}
            isActive={isActive}
          />
        );
      })}
    </div>
  );
}
