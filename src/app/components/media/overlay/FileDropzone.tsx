import { PropsWithChildren, ReactElement, useState } from "react";
import Dropzone, { DropFilesEventHandler } from "react-dropzone";
import { Attachment } from "../../../types/grud";
import { makeRequest } from "../../../helpers/apiHelper";
import { toFileUpload } from "../../../helpers/apiRoutes";
import { useDispatch } from "react-redux";
import { getMediaFile } from "../../../redux/actions/mediaActions";
import ProgressBar from "../ProgressBar";
import { buildClassName as cn } from "../../../helpers/buildClassName";

type FileDropzoneProps = PropsWithChildren<{
  className?: string;
  fileLangtag: string;
  file: Attachment;
  disabled?: boolean;
}>;

export default function FileDropzone({
  className,
  fileLangtag,
  file,
  disabled,
  children
}: FileDropzoneProps): ReactElement {
  const dispatch = useDispatch();
  const [progress, setProgress] = useState<number | undefined>(0);

  const onDrop: DropFilesEventHandler = async uploadFiles => {
    for (const uploadFile of uploadFiles) {
      makeRequest({
        method: "PUT",
        apiRoute: toFileUpload(file.uuid, fileLangtag),
        file: uploadFile,
        onProgress: progress => {
          setProgress(progress.percent ?? 0);
        }
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

  return (
    <Dropzone
      className={cn("dropzone", {}, className)}
      onDrop={onDrop}
      multiple={false}
      disabled={disabled}
    >
      {!!progress && <ProgressBar progress={progress} />}
      {children}
    </Dropzone>
  );
}
