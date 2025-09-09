import { ReactElement } from "react";
import { SharedProps, FilterMode, OrderMode } from "./AttachmentOverlay";
import Header from "../../overlay/Header";
import AttachmentFilter from "./AttachmentFilter";
import AttachmentOrder from "./AttachmentOrder";

type AttachmentOverlayHeaderProps = SharedProps;

export default function AttachmentOverlayHeader(
  props: AttachmentOverlayHeaderProps
): ReactElement {
  const { sharedData, updateSharedData } = props;
  const { filterValue, filterMode, orderMode } = sharedData ?? {};

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

  const handleUpdateOrderMode = (mode: OrderMode) => {
    updateSharedData?.(() => ({
      ...sharedData,
      orderMode: mode
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
        <AttachmentOrder
          mode={orderMode}
          onUpdateMode={handleUpdateOrderMode}
        />
      </div>
    </Header>
  );
}
