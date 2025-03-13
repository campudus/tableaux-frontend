import {
  branch,
  compose,
  pure,
  renderNothing,
  withHandlers,
  withState
} from "recompose";
import { translate } from "react-i18next";
import Dropzone from "react-dropzone";
import React from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { DefaultLangtag } from "../../../constants/TableauxConstants";
import { canUserCreateMedia } from "../../../helpers/accessManagementHelper";
import { makeRequest } from "../../../helpers/apiHelper";
import ProgressBar from "../ProgressBar.jsx";
import route from "../../../helpers/apiRoutes";
import { doto } from "../../../helpers/functools";

const withUploadHandlers = compose(
  withState("runningUploads", "applyUploadUpdater", {}),
  withHandlers({
    updateUploads: ({ applyUploadUpdater }) => fn => applyUploadUpdater(fn)
  }),
  withHandlers({
    uploadCallback: props => (err, res, uuid) => {
      const { updateUploads } = props;
      updateUploads(f.omit(uuid));

      if (err) {
        console.error("FileUpload.uploadCallback", err);
        return;
      }

      if (res) {
        props.actions.getMediaFolder(props.folder.id, props.langtag);
      }
    }
  })
);

const withDropHandlers = withHandlers({
  onDrop: props => files => {
    // upload with default language
    files.forEach(async file => {
      // Backend accepts only single file uploads
      const fileMetadata = f.flow(
        f.assoc(["title", DefaultLangtag], file.name),
        f.assoc(["description", DefaultLangtag], ""),
        f.assoc("folder", props.folder.id)
      )({});

      const onProgress = progress => {
        props.updateUploads(
          f.assoc(uuid, {
            progress: parseInt(progress.percent),
            name: file.name
          })
        );
      };

      const fileNode = await makeRequest({
        apiRoute: route.toFile(),
        method: "POST",
        data: fileMetadata
      });

      const { uuid } = fileNode;
      const uploadUrl = route.toFile() + "/" + uuid + "/" + DefaultLangtag;

      makeRequest({ apiRoute: uploadUrl, method: "PUT", file, onProgress })
        .then(response => props.uploadCallback(null, response, uuid))
        .catch(err => props.uploadCallback(err, null, uuid));
    });
  }
});

const RunningUploadPanel = compose(
  branch(props => f.size(props.uploads) < 1, renderNothing),
  pure
)(props => (
  <div className="running-uploads">
    <span className="uploads-text">{props.t("current_uploads")}:</span>
    {props.uploads}
  </div>
));

const FileUpload = props => {
  const { runningUploads, t, onDrop } = props;

  const uploads = doto(
    runningUploads,
    f.keys,
    f.map(uploadUuid => (
      <div className="file-upload" key={uploadUuid}>
        <span>{runningUploads[uploadUuid].name}</span>
        <ProgressBar progress={runningUploads[uploadUuid].progress} />
      </div>
    ))
  );

  return (
    <div className="file-uploads">
      <RunningUploadPanel uploads={uploads} t={props.t} />
      <Dropzone onDrop={onDrop} className="dropzone">
        <a>{t("upload_click_or_drop")}</a>
      </Dropzone>
    </div>
  );
};

FileUpload.propTypes = {
  folder: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired
};

export default compose(
  branch(() => !canUserCreateMedia(), renderNothing),
  withUploadHandlers,
  withDropHandlers,
  pure,
  translate(["media"])
)(FileUpload);
