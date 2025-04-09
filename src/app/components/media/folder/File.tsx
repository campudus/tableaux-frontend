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
    <div className="file">
      <a
        className="file__link"
        href={imageUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>{title}</span>
        <i className="icon fa fa-external-link" />
      </a>

      <div className="file__actions">
        {canUserEditFiles() && (
          <button
            className="file__action"
            onClick={onEdit}
            title={i18n.t("media:change_file")}
          >
            <i className="icon fa fa-cog" />
          </button>
        )}

        {canUserDeleteFiles() ? (
          <button
            className="file__action"
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
