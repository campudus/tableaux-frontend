import store from "../../../redux/store";
import actions from "../../../redux/actionCreators";
import { Folder } from "../../../types/grud";
import AttachmentOverlayBody, {
  AttachmentOverlayBodyProps
} from "./AttachmentOverlayBody";
import AttachmentOverlayHeader from "./AttachmentOverlayHeader";
import { FilterModes } from "../../../constants/TableauxConstants";

export const FILTER_MODE_DEFAULT = FilterModes.CONTAINS;

export type FilterMode =
  | typeof FilterModes.CONTAINS
  | typeof FilterModes.STARTS_WITH;

export type Layout = "list" | "tiles";

export type SharedData = {
  folder?: Folder;
  filterValue?: string;
  filterMode?: FilterMode;
};

export type SharedProps = {
  langtag: string;
  // provided through hoc
  sharedData?: SharedData;
  updateSharedData?: (updateFn: (data?: SharedData) => SharedData) => void;
};

export function openAttachmentOverlay({
  langtag,
  cell,
  folderId
}: AttachmentOverlayBodyProps) {
  store.dispatch(
    actions.openOverlay({
      head: <AttachmentOverlayHeader langtag={langtag} />,
      body: (
        <AttachmentOverlayBody
          cell={cell}
          langtag={langtag}
          folderId={folderId}
        />
      ),
      type: "full-height",
      preferRight: true,
      title: cell
    })
  );
}
