import ProgressBar from "../ProgressBar.jsx";
import apiUrl from "../../../helpers/apiUrl";
import request from "superagent";
import Dropzone from "react-dropzone";
import React from "react";
import { translate } from "react-i18next";
import { DefaultLangtag } from "../../../constants/TableauxConstants";
import PropTypes from "prop-types";
import f from "lodash/fp";
import {
  branch,
  compose,
  pure,
  renderNothing,
  withHandlers,
  withState
} from "recompose";

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
    files.forEach(file => {
      // upload each file on its own

      const json = f.flow(
        f.assoc(["title", DefaultLangtag], file.name),
        f.assoc(["description", DefaultLangtag], ""),
        f.assoc("folder", props.folder.id)
      )({});

      request
        .post(apiUrl("/files"))
        .send(json)
        .end(function(err, res) {
          if (err) {
            console.error("Create file handle failed.", err);
            return;
          }

          const result = res.body;
          const uuid = result.uuid;
          const uploadUrl = apiUrl("/files/" + uuid + "/" + DefaultLangtag);

          request
            .put(uploadUrl)
            .on("progress", e =>
              props.updateUploads(
                f.assoc(uuid, {
                  progress: parseInt(e.percent),
                  name: file.name
                })
              )
            )
            .attach("file", file, file.name)
            .end(function(err, res) {
              props.uploadCallback(err, res, uuid);
            });
        });
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
  let uploads = [];
  const { runningUploads, t, onDrop } = props;
  for (let uploadUuid in runningUploads) {
    if (runningUploads.hasOwnProperty(uploadUuid)) {
      uploads.push(
        <div className="file-upload" key={uploadUuid}>
          <span>{runningUploads[uploadUuid].name}</span>
          <ProgressBar progress={runningUploads[uploadUuid].progress} />
        </div>
      );
    }
  }

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
  withUploadHandlers,
  withDropHandlers,
  pure,
  translate(["media"])
)(FileUpload);
