import i18n from "i18next";
import { ReactElement } from "react";
import { useDispatch } from "react-redux";
import { Attachment } from "../../../types/grud";
import {
  canUserDeleteFiles,
  canUserEditFiles
} from "../../../helpers/accessManagementHelper";
import apiUrl from "../../../helpers/apiUrl";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import { FileEditBody, FileEditFooter } from "../overlay/FileEdit";
import actions from "../../../redux/actionCreators";
import { confirmDeleteFile } from "../../overlay/ConfirmationOverlay";
import Header from "../../overlay/Header";

type FileProps = {
  langtag: string;
  file: Attachment;
};

export default function File({ langtag, file }: FileProps): ReactElement {
  const dispatch = useDispatch();
  const title = retrieveTranslation(langtag)(file.title);
  const imageUrl = apiUrl(retrieveTranslation(langtag)(file.url));

  const onRemove = () => {
    confirmDeleteFile(title, () => {
      dispatch(actions.deleteMediaFile(file.uuid));
    });
  };

  const onEdit = () => {
    dispatch(
      actions.openOverlay({
        name: title,
        head: <Header title={title} context={i18n.t("media:change_file")} />,
        body: <FileEditBody langtag={langtag} fileId={file.uuid} />,
        footer: <FileEditFooter langtag={langtag} fileId={file.uuid} />
      })
    );
  };

  return (
    <div key={"file" + file.uuid} className="file">
      {canUserEditFiles() ? (
        <button className="file-link" onClick={onEdit}>
          <i className="icon fa fa-file" />
          <span>{title}</span>
        </button>
      ) : (
        <a
          className="file-link"
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="icon fa fa-file" />
          <span>{title}</span>
        </a>
      )}

      <div className="media-options">
        {canUserEditFiles() && (
          <button className="button" onClick={onEdit}>
            <i className="icon fa fa-pencil-square-o" />
            {i18n.t("media:change_file")}
          </button>
        )}

        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="button"
        >
          <i className="icon fa fa-external-link" />
          {i18n.t("media:show_file")}
        </a>

        {canUserDeleteFiles() ? (
          <button
            className="button"
            onClick={onRemove}
            title={i18n.t("media:delete_file")}
          >
            <i className="fa fa-trash" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
