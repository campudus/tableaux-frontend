import React from "react";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import { canUserCreateMedia } from "../../../helpers/accessManagementHelper";
import FileChangeUpload from "./FileChangeUpload";
import MediaLink from "../MediaLink";
import MultilangFileDropzone from "./MultilangFileDropzone";
import SingleFileTextInput from "./SingleFileTextInput";

const SingleFileEdit = ({
  file,
  langtag,
  fileAttributes,
  setFileAttribute,
  actions
}) => {
  const { internalName, uuid } = file;
  const fileLangtag = Object.keys(internalName)[0];
  const fileInternalName = internalName[fileLangtag];

  return (
    <div className="singlefile-edit">
      <div className="item cover-wrapper">
        <div className="cover">
          <FileChangeUpload
            langtag={fileLangtag}
            internalFileName={fileInternalName}
            uuid={uuid}
            actions={actions}
          />
        </div>
        <span className="open-file">
          <MediaLink langtag={langtag} file={file}>
            {i18n.t("media:open_file")}
          </MediaLink>
        </span>
      </div>

      <div className="properties-wrapper content-items">
        <SingleFileTextInput
          name="title"
          labelText={i18n.t("media:file_title_label")}
          value={f.getOr("", "title", fileAttributes)}
          langtag={langtag}
          setFileAttribute={setFileAttribute}
        />

        <SingleFileTextInput
          name="description"
          labelText={i18n.t("media:file_description_label")}
          value={f.getOr("", "description", fileAttributes)}
          langtag={langtag}
          setFileAttribute={setFileAttribute}
        />

        <SingleFileTextInput
          name="externalName"
          labelText={i18n.t("media:file_link_name_label")}
          value={f.getOr("", "externalName", fileAttributes)}
          langtag={langtag}
          setFileAttribute={setFileAttribute}
        />
      </div>

      {canUserCreateMedia() && (
        <MultilangFileDropzone
          file={file}
          langtag={langtag}
          actions={actions}
        />
      )}
    </div>
  );
};

SingleFileEdit.propTypes = {
  setFileAttribute: PropTypes.func.isRequired,
  langtag: PropTypes.string.isRequired,
  file: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired
};

export default SingleFileEdit;
