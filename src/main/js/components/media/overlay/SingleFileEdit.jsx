import React from "react";
import PropTypes from "prop-types";
import SingleFileTextInput from "./SingleFileTextInput";
import FileChangeUpload from "./FileChangeUpload";
import i18n from "i18next";
import MediaLink from "../MediaLink";
import f from "lodash/fp";
import MultilangFileDropzone from "./MultilangFileDropzone";
import {pure} from "recompose";

const SingleFileEdit = ({file, langtag, fileAttributes, setFileAttribute}) => {
  const {internalName, uuid} = file;
  const fileLangtag = Object.keys(internalName)[0];
  const fileInternalName = internalName[fileLangtag];

  return (
    <div className="singlefile-edit">

      <div className="item cover-wrapper">
        <div className="cover">
          <FileChangeUpload langtag={fileLangtag}
                            internalFileName={fileInternalName}
                            uuid={uuid}
          />
          <span className="open-file">
            <MediaLink langtag={langtag}
                       file={file}
            >
              {i18n.t("media:open_file")}
            </MediaLink>
          </span>
        </div>
      </div>

      <div className="properties-wrapper content-items">
        <SingleFileTextInput name="title"
                             labelText={i18n.t("media:file_title_label")}
                             value={f.getOr("", "title", fileAttributes)}
                             langtag={langtag}
                             setFileAttribute={setFileAttribute}
        />

        <SingleFileTextInput name="description"
                             labelText={i18n.t("media:file_description_label")}
                             value={f.getOr("", "description", fileAttributes)}
                             langtag={langtag}
                             setFileAttribute={setFileAttribute}
        />

        <SingleFileTextInput name="externalName"
                             labelText={i18n.t("media:file_link_name_label")}
                             value={f.getOr("", "externalName", fileAttributes)}
                             langtag={langtag}
                             setFileAttribute={setFileAttribute}
        />
      </div>

      <MultilangFileDropzone file={file}
                             langtag={langtag}
      />

    </div>
  );
};

SingleFileEdit.propTypes = {
  setFileAttribute: PropTypes.func.isRequired,
  langtag: PropTypes.string.isRequired,
  file: PropTypes.object.isRequired
};

export default SingleFileEdit;
