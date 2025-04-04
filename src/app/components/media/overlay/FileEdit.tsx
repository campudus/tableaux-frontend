import i18n from "i18next";
import f from "lodash/fp";
import { useSelector } from "react-redux";
import { ReactElement, useEffect, useRef, useState } from "react";
import { Attachment } from "../../../types/grud";
import MultiFileEdit from "./MultiFileEdit";
import SingleFileEdit from "./SingleFileEdit";
import { FileEditData } from "../../../redux/actions/mediaActions";
import Footer from "../../overlay/Footer";
import { canUserEditFiles } from "../../../helpers/accessManagementHelper";
import { MediaState } from "../../../redux/reducers/media";

type ReduxState = { media: MediaState };

export type FileMeta = Partial<
  Pick<Attachment, "title" | "description" | "externalName">
>;

export type FileMetaKey = keyof FileMeta;

type FileEditProps = {
  langtag: string;
  fileId: string;
  // provided through hoc
  sharedData?: FileMeta;
  updateSharedData?: (updateFn: (data?: FileMeta) => FileMeta) => void;
  actions?: {
    editMediaFile: (fileId?: string, data?: FileEditData) => void;
  };
};

export function FileEditBody({
  langtag,
  fileId,
  updateSharedData: updateFileMeta
}: FileEditProps): ReactElement | null {
  const file = useSelector<ReduxState, Attachment | undefined>(state =>
    state.media.data?.files?.find(f.propEq("uuid", fileId))
  );
  const { title, description, externalName } = file ?? {};
  const initialFileMeta = { title, description, externalName };
  const [fileMeta, setFileMeta] = useState(initialFileMeta);
  const oldFile = useRef(file);
  const hasMultilangFiles = f.keys(file?.internalName).length > 1;

  const handleUpdateFileMeta = (
    name: FileMetaKey,
    langtag: string,
    value: string
  ) => {
    setFileMeta(f.assoc([name, langtag], value));
  };

  useEffect(() => {
    if (!f.isEqual(oldFile.current, file)) {
      setFileMeta(initialFileMeta);
    }
  }, [oldFile.current, file]);

  useEffect(() => {
    updateFileMeta?.(() => fileMeta);
  }, [fileMeta]);

  if (!file) {
    return null;
  }

  return hasMultilangFiles ? (
    <MultiFileEdit
      langtag={langtag}
      file={file}
      fileMeta={fileMeta}
      updateFileMeta={handleUpdateFileMeta}
    />
  ) : (
    <SingleFileEdit
      langtag={langtag}
      file={file}
      fileMeta={fileMeta}
      updateFileMeta={handleUpdateFileMeta}
    />
  );
}

export function FileEditFooter(props: FileEditProps): ReactElement {
  const { fileId, sharedData: fileMeta, actions } = props;
  const canEdit = canUserEditFiles();

  const handleSave = () => {
    if (fileMeta && actions) {
      // already connected to dispatch
      actions.editMediaFile(fileId, fileMeta);
    }
  };

  return (
    <Footer
      {...props}
      buttonActions={{
        neutral: [i18n.t("common:cancel"), null],
        positive: canEdit ? [i18n.t("common:save"), handleSave] : null
      }}
    />
  );
}
