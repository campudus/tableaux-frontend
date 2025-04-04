import { PropsWithChildren, ReactElement, useState } from "react";
import Dropzone, { DropFilesEventHandler } from "react-dropzone";
import { Attachment } from "../../../types/grud";
import { makeRequest } from "../../../helpers/apiHelper";
import { toFileUpload } from "../../../helpers/apiRoutes";
import { useDispatch } from "react-redux";
import { getMediaFile } from "../../../redux/actions/mediaActions";
import { canUserEditFiles } from "../../../helpers/accessManagementHelper";
import FileIcon from "../folder/FileIcon";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import ProgressBar from "../ProgressBar";

type FileDropzoneProps = PropsWithChildren<{
  langtag: string;
  fileLangtag: string;
  file: Attachment;
}>;

export default function FileDropzone({
  langtag,
  fileLangtag,
  file,
  children
}: FileDropzoneProps): ReactElement {
  const dispatch = useDispatch();
  const [progress, setProgress] = useState<number | undefined>(0);
  const fileInternalName = retrieveTranslation(langtag)(file.internalName);

  const onDrop: DropFilesEventHandler = async uploadFiles => {
    for (const uploadFile of uploadFiles) {
      makeRequest({
        method: "PUT",
        apiRoute: toFileUpload(file.uuid, fileLangtag),
        file: uploadFile
      })
        .then(() => {
          setProgress(0);
          dispatch(getMediaFile(file.uuid));
        })
        .catch(err => {
          setProgress(0);
          console.error("Error uploading file:", err);
        });
    }
  };

  if (!canUserEditFiles()) {
    return (
      <div className="no-permission-upload-file">
        <FileIcon name={fileInternalName} />
      </div>
    );
  }

  return (
    <Dropzone className="dropzone" onDrop={onDrop} multiple={false}>
      {!!progress && <ProgressBar progress={progress} />}
      {children}
    </Dropzone>
  );
}
