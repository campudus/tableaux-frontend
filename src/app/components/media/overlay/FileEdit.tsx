import i18n from "i18next";
import f from "lodash/fp";
import { useDispatch, useSelector } from "react-redux";
import { ReactElement, useEffect, useRef, useState } from "react";
import { Attachment } from "../../../types/grud";
import { editMediaFile } from "../../../redux/actions/mediaActions";
import Footer from "../../overlay/Footer";
import {
  canUserCreateFiles,
  canUserEditFiles
} from "../../../helpers/accessManagementHelper";
import { MediaState } from "../../../redux/reducers/media";
import { Langtags } from "../../../constants/TableauxConstants";
import FileEditItem from "./FileEditItem";
import LanguageSwitcher from "../../header/LanguageSwitcher";

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
  const fileLangtags = f.keys(file?.internalName);
  const fileLangtagsMultilang = fileLangtags.slice(1);
  const defaultFileLangtag = fileLangtags.at(0);
  const fileLangtagsUnset = f.difference(Langtags, fileLangtags);
  const [newFileLangtag, setNewFileLangtag] = useState(fileLangtagsUnset.at(0));

  const handleNewFileLangtag = (newLangtag: string) => {
    setNewFileLangtag(newLangtag);
  };

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

    if (!f.includes(newFileLangtag, fileLangtagsUnset)) {
      setNewFileLangtag(fileLangtagsUnset.at(0));
    }
  }, [oldFile.current, file]);

  useEffect(() => {
    updateFileMeta?.(() => fileMeta);
  }, [fileMeta]);

  if (!file) {
    return null;
  }

  return (
    <div className="file-edit">
      <FileEditItem
        langtag={langtag}
        file={file}
        fileLangtag={defaultFileLangtag!}
        fileMeta={fileMeta}
        updateFileMeta={handleUpdateFileMeta}
        isMultilang={!hasMultilangFiles}
      />

      {fileLangtagsMultilang.map(fileLangtag => (
        <FileEditItem
          key={fileLangtag}
          langtag={langtag}
          file={file}
          fileLangtag={fileLangtag}
          fileMeta={fileMeta}
          updateFileMeta={handleUpdateFileMeta}
          isMultilang={false}
        />
      ))}

      {canUserCreateFiles() && newFileLangtag && (
        <FileEditItem
          langtag={langtag}
          fileLangtag={newFileLangtag}
          file={file}
          fileMeta={fileMeta}
          updateFileMeta={handleUpdateFileMeta}
          isMultilang={false}
        >
          <LanguageSwitcher
            langtag={newFileLangtag}
            onChange={handleNewFileLangtag}
            options={fileLangtagsUnset.map(lt => ({ value: lt, label: lt }))}
          />
        </FileEditItem>
      )}
    </div>
  );
}

export function FileEditFooter(props: FileEditProps): ReactElement {
  const { fileId, sharedData: fileMeta } = props;
  const canEdit = canUserEditFiles();
  const dispatch = useDispatch();

  const handleSave = () => {
    if (fileMeta) {
      dispatch(editMediaFile(fileId, fileMeta));
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
