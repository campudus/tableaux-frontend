import f from "lodash/fp";
import i18n from "i18next";
import { useDispatch } from "react-redux";
import { ForwardedRef, forwardRef, ReactElement, useState } from "react";
import Dropzone, { DropFilesEventHandler } from "react-dropzone";
import { Attachment, Folder } from "../../../types/grud";
import { DefaultLangtag } from "../../../constants/TableauxConstants";
import { toFile, toFileUpload } from "../../../helpers/apiRoutes";
import { makeRequest } from "../../../helpers/apiHelper";
import ProgressBar from "../ProgressBar";
import { getMediaFolder } from "../../../redux/actions/mediaActions";

type UploadState = {
  name: string;
  progress: number;
};

type UploadMap = Record<string, UploadState>;

type FileUploadProps = {
  langtag: string;
  folder: Partial<Folder>;
};

function FileUpload(
  { langtag, folder }: FileUploadProps,
  ref: ForwardedRef<Dropzone>
): ReactElement {
  const dispatch = useDispatch();
  const [uploadMap, setUploadMap] = useState<UploadMap>({});
  const uploads = f.entries(uploadMap);

  const onDrop: DropFilesEventHandler = async uploadFiles => {
    for (const uploadFile of uploadFiles) {
      const { uuid }: Attachment = await makeRequest({
        apiRoute: toFile(),
        method: "POST",
        data: {
          title: { [DefaultLangtag]: uploadFile.name },
          description: { [DefaultLangtag]: "" },
          folder: folder.id
        }
      });

      makeRequest({
        apiRoute: toFileUpload(uuid, DefaultLangtag),
        method: "PUT",
        file: uploadFile,
        onProgress: progress => {
          const uploadState = {
            progress: progress.percent ?? 0,
            name: uploadFile.name
          };

          setUploadMap(state => ({ ...state, [uuid]: uploadState }));
        }
      })
        .then(() => {
          setUploadMap(f.omit(uuid));
          dispatch(getMediaFolder(folder.id, langtag));
        })
        .catch(err => {
          setUploadMap(f.omit(uuid));
          console.error("Error uploading file:", err);
        });
    }
  };

  return (
    <div className="file-upload">
      {uploads.length >= 1 && (
        <div className="file-upload__info">
          <span className="file-upload__info-title">
            {i18n.t("media:current_uploads")}:
          </span>

          {uploads.map(([uuid, { name, progress }]) => (
            <div className="file-upload__info-progress" key={uuid}>
              <span>{name}</span>
              <ProgressBar progress={progress} />
            </div>
          ))}
        </div>
      )}

      <Dropzone ref={ref} onDrop={onDrop} className="file-upload__dropzone">
        <a>{i18n.t("media:upload_click_or_drop")}</a>
      </Dropzone>
    </div>
  );
}

export default forwardRef(FileUpload);
