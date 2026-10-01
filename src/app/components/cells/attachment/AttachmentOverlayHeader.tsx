import { ReactElement } from "react";
import { SharedProps, FilterMode } from "./AttachmentOverlay";
import Header from "../../overlay/Header";
import AttachmentFilter from "./AttachmentFilter";
import DirentOrderControl from "../../media/folder/DirentOrderControl";
import {
  DEFAULT_DIRENT_ORDER,
  DirentOrder
} from "../../media/folder/direntOrdering";

type AttachmentOverlayHeaderProps = SharedProps;

export default function AttachmentOverlayHeader(
  props: AttachmentOverlayHeaderProps
): ReactElement {
  const { sharedData, updateSharedData } = props;
  const {
    filterValue,
    filterMode,
    order = DEFAULT_DIRENT_ORDER
  } = sharedData ?? {};

  const handleUpdateFilterValue = (value: string) => {
    updateSharedData?.(() => ({
      ...sharedData,
      filterValue: value
    }));
  };

  const handleUpdateFilterMode = (mode: FilterMode) => {
    updateSharedData?.(() => ({
      ...sharedData,
      filterMode: mode,
      // clear filterValue on filterMode change
      filterValue: ""
    }));
  };

  const handleUpdateOrder = (order: DirentOrder) => {
    updateSharedData?.(() => ({
      ...sharedData,
      order
    }));
  };

  return (
    <Header {...props}>
      <div className="attachment-overlay-header">
        <AttachmentFilter
          value={filterValue}
          mode={filterMode}
          onUpdateValue={handleUpdateFilterValue}
          onUpdateMode={handleUpdateFilterMode}
        />
        <DirentOrderControl order={order} onChange={handleUpdateOrder} />
      </div>
    </Header>
  );
}
