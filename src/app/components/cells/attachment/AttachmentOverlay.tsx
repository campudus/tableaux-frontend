import store from "../../../redux/store";
import actions from "../../../redux/actionCreators";
import { Folder } from "../../../types/grud";
import Header from "../../overlay/Header";
import AttachmentOverlayBody, {
  AttachmentOverlayBodyProps
} from "./AttachmentOverlayBody";

export type Layout = "list" | "tiles";

export type SharedData = {
  folder?: Folder;
  search?: string;
  sortKey?: string;
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
      head: <Header langtag={langtag} />,
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
