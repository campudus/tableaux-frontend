import {
  branch,
  compose,
  pure,
  renderNothing,
  withHandlers,
  withStateHandlers
} from "recompose";
import { translate } from "react-i18next";
import Dropzone from "react-dropzone";
import React from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { DefaultLangtag, Langtags } from "../../../constants/TableauxConstants";
import {
  canUserCreateMedia,
  canUserEditFiles
} from "../../../helpers/accessManagementHelper";
import LanguageSwitcher from "../../header/LanguageSwitcher";
import { makeRequest } from "../../../helpers/apiHelper";
import route from "../../../helpers/apiRoutes";

const enhance = compose(
  withStateHandlers(
    () => {
      const langOptions = Langtags.filter(
        lt => lt !== DefaultLangtag && canUserEditFiles(lt)
      );

      return {
        langtag: f.head(langOptions),
        langOptions: langOptions
      };
    },
    {
      handleLanguageSwitch: () => langtag => ({ langtag })
    }
  ),
  withHandlers({
    uploadCallback: () => actions => (err, uploadRes) => {
      if (err) {
        console.error("FileDelete.uploadCallback", err);
        return;
      }

      if (uploadRes) {
        // on success reload file from api into state
        const file = uploadRes.body;
        actions.getMediaFile(file.uuid);
      }
    }
  }),
  withHandlers({
    handleDrop: ({
      file: { uuid },
      langtag,
      uploadCallback,
      actions
    }) => files => {
      const uploadUrl = route.toFile(uuid, langtag);
      files.forEach(file => {
        makeRequest({ apiRoute: uploadUrl, method: "PUT", file }).then(
          uploadCallback(actions)
        );
      });
    }
  })
);

const MultilangFileDropzone = ({
  langtag,
  langOptions,
  handleDrop,
  handleLanguageSwitch,
  t
}) => {
  return (
    <div className="multifile-wrapper item">
      <Dropzone className="item dropzone" onDrop={handleDrop} multiple={false}>
        <div className="convert-multilanguage-note">
          <h4>{t("convert_multilanguage_hl")}</h4>
          <p>{t("convert_multilanguage_description")}</p>
        </div>
      </Dropzone>
      <LanguageSwitcher
        openOnTop
        onChange={handleLanguageSwitch}
        langtag={langtag}
        options={langOptions.map(lt => ({ value: lt, label: lt }))}
      />
    </div>
  );
};

export default compose(
  pure,
  branch(() => !canUserCreateMedia(), renderNothing),
  enhance,
  translate(["media"])
)(MultilangFileDropzone);

MultilangFileDropzone.propTypes = {
  file: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired
};
