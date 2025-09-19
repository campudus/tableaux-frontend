import store from "../../../redux/store";
import actions from "../../../redux/actionCreators";
import { Folder } from "../../../types/grud";
import AttachmentOverlayBody, {
  AttachmentOverlayBodyProps
} from "./AttachmentOverlayBody";
import AttachmentOverlayHeader from "./AttachmentOverlayHeader";
import { FilterModes } from "../../../constants/TableauxConstants";

export type FilterMode =
  | typeof FilterModes.CONTAINS
  | typeof FilterModes.STARTS_WITH;

export const FILTER_MODE_DEFAULT: FilterMode = FilterModes.CONTAINS;

export const ORDER_MODE = {
  CREATED_AT: "createdAt",
  TITLE: "title"
} as const;

export type OrderMode = typeof ORDER_MODE[keyof typeof ORDER_MODE];

export const ORDER_MODE_DEFAULT: OrderMode = ORDER_MODE.TITLE;

export type Layout = "list" | "tiles";

export type ToggleAction = "add" | "remove";

export type SharedData = {
  folder?: Folder;
  filterValue?: string;
  filterMode?: FilterMode;
  orderMode?: OrderMode;
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
