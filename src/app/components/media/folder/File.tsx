import f from "lodash/fp";
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
import { buildClassName as cn } from "../../../helpers/buildClassName";
import FileDependentsBody from "../overlay/FileDependents";

type FileProps = {
  langtag: string;
  file: Attachment;
};

export default function File({ langtag, file }: FileProps): ReactElement {
  const dispatch = useDispatch();
  const title = retrieveTranslation(langtag)(file.title);
  const imageUrl = apiUrl(retrieveTranslation(langtag)(file.url));

  const { dependentRowCount: depCount } = file;
  const depLabel = f.cond([
    [f.eq(0), () => null],
    [f.eq(1), () => i18n.t("media:show_dependent_row")],
    [f.lt(1), () => i18n.t("media:show_dependent_rows", { count: depCount })]
  ])(file.dependentRowCount);

  const handleRemove = () => {
    confirmDeleteFile(title, () => {
      dispatch(actions.deleteMediaFile(file.uuid));
    });
  };

  const handleOpenEditOverlay = () => {
    dispatch(
      actions.openOverlay({
        name: `change-file-${title}`,
        head: <Header title={title} context={i18n.t("media:change_file")} />,
        body: <FileEditBody langtag={langtag} fileId={file.uuid} />,
        footer: <FileEditFooter langtag={langtag} fileId={file.uuid} />
      })
    );
  };

  const handleOpenMoveOverlay = () => {
    dispatch(
      actions.openOverlay({
        name: `move-file-${title}`,
        head: (
          <DirentMoveHeader
            langtag={langtag}
            context={i18n.t("media:move_file", { name: title })}
          />
        ),
        body: <DirentMoveBody langtag={langtag} sourceFile={file} />,
        footer: <DirentMoveFooter langtag={langtag} sourceFile={file} />,
        classes: "dirent-move"
      })
    );
  };

  const handleOpenDependentsOverlay = () => {
    dispatch(
      actions.openOverlay({
        name: `show-file-dependents-for-${title}`,
        head: <Header title={title} context={i18n.t("media:dependents")} />,
        body: <FileDependentsBody langtag={langtag} file={file} />,
        classes: "file-dependents"
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
        {depCount > 0 && depLabel && (
          <button
            className={cn("file__action", { link: true })}
            onClick={handleOpenDependentsOverlay}
            title={depLabel}
          >
            {depLabel}
          </button>
        )}

        {canUserEditFiles() && (
          <button
            className="file__action"
            onClick={handleOpenMoveOverlay}
            title={i18n.t("media:move_file")}
          >
            <SvgIcon icon="move" />
          </button>
        )}

        {canUserEditFiles() && (
          <button
            className="file__action"
            onClick={handleOpenEditOverlay}
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
