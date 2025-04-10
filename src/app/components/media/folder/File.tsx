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
import SvgIcon from "../../helperComponents/SvgIcon";
import {
  DirentMoveBody,
  DirentMoveFooter,
  DirentMoveHeader
} from "../overlay/DirentMove";

type FileProps = {
  langtag: string;
  file: Attachment;
};

export default function File({ langtag, file }: FileProps): ReactElement {
  const dispatch = useDispatch();
  const title = retrieveTranslation(langtag)(file.title);
  const imageUrl = apiUrl(retrieveTranslation(langtag)(file.url));

  const handleRemove = () => {
    confirmDeleteFile(title, () => {
      dispatch(actions.deleteMediaFile(file.uuid));
    });
  };

  const handleEdit = () => {
    dispatch(
      actions.openOverlay({
        name: `change-file-${title}`,
        head: <Header title={title} context={i18n.t("media:change_file")} />,
        body: <FileEditBody langtag={langtag} fileId={file.uuid} />,
        footer: <FileEditFooter langtag={langtag} fileId={file.uuid} />
      })
    );
  };

  const handleMove = () => {
    dispatch(
      actions.openOverlay({
        name: `move-file-${title}`,
        // prettier-ignore
        head: <DirentMoveHeader langtag={langtag} title={i18n.t("media:move_file")} />,
        body: <DirentMoveBody langtag={langtag} sourceFile={file} />,
        footer: <DirentMoveFooter langtag={langtag} sourceFile={file} />,
        classes: "dirent-move"
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
            onClick={handleMove}
            title={i18n.t("media:move_file")}
          >
            <SvgIcon icon="move" />
          </button>
        )}

        {canUserEditFiles() && (
          <button
            className="file__action"
            onClick={handleEdit}
            title={i18n.t("media:change_file")}
          >
            <i className="icon fa fa-cog" />
          </button>
        )}

        {canUserDeleteFiles() ? (
          <button
            className="file__action"
            onClick={handleRemove}
            title={i18n.t("media:delete_file")}
          >
            <i className="fa fa-trash" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
