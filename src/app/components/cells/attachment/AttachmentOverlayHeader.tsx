import { ReactElement } from "react";
import { SharedProps, FilterMode } from "./AttachmentOverlay";
import Header from "../../overlay/Header";
import AttachmentFilter from "./AttachmentFilter";

type AttachmentOverlayHeaderProps = SharedProps;

export default function AttachmentOverlayHeader(
  props: AttachmentOverlayHeaderProps
): ReactElement {
  const { sharedData, updateSharedData } = props;
  const { filterValue, filterMode } = sharedData ?? {};

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

  return (
    <Header {...props}>
      <AttachmentFilter
        value={filterValue}
        mode={filterMode}
        onUpdateValue={handleUpdateFilterValue}
        onUpdateMode={handleUpdateFilterMode}
      />
    </Header>
  );
}
