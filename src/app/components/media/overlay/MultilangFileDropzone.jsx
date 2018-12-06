import React from "react";
import PropTypes from "prop-types";
import Dropzone from "react-dropzone";
import LanguageSwitcher from "../../header/LanguageSwitcher";
import {compose, pure, withHandlers, withStateHandlers} from "recompose";
import {translate} from "react-i18next";
import {DefaultLangtag, Langtags} from "../../../constants/TableauxConstants";
import withAbortableXhrRequests from "../../helperComponents/withAbortableXhrRequests";
import apiUrl from "../../../helpers/apiUrl";
import Request from "superagent";
import ActionCreator from "../../../actions/ActionCreator";
import {hasUserAccessToLanguage} from "../../../helpers/accessManagementHelper";
import f from "lodash/fp";

const enhance = compose(
  withStateHandlers(
    () => {
      const langOptions = Langtags.filter(
        (lt) => lt !== DefaultLangtag && hasUserAccessToLanguage(lt)
      );

      return ({
        langtag: f.head(langOptions),
        langOptions: langOptions
      });
    },
    {
      handleLanguageSwitch: () => (langtag) => ({langtag})
    }
  ),
  withHandlers({
    uploadCallback: () => (err, uploadRes) => {
      if (err) {
        console.error("FileDelete.uploadCallback", err);
        return;
      }

      if (uploadRes) {
        const file = uploadRes.body;
        ActionCreator.changedFileData(file.uuid, file.title, file.description, file.externalName, file.internalName, file.mimeType, file.folder, file.url);
      }
    }
  }),
  withHandlers({
    handleDrop: ({addAbortableXhrRequest, file: {uuid}, langtag, uploadCallback}) => (files) => {
      const uploadUrl = apiUrl("/files/" + uuid + "/" + langtag);
      files.forEach(
        (file) => {
          const req = Request
            .put(uploadUrl)
            .attach("file", file, file.name)
            .end(uploadCallback);
          addAbortableXhrRequest(req);
        }
      );
    }
  })
);

const MultilangFileDropzone = ({langtag, langOptions, handleDrop, handleLanguageSwitch, t}) => {
  return (
    <div className="multifile-wrapper item">
      <Dropzone className="item dropzone"
                onDrop={handleDrop}
                multiple={false}
      >
        <div className="convert-multilanguage-note">
          <h4>{t("convert_multilanguage_hl")}</h4>
          <p>{t("convert_multilanguage_description")}</p>
        </div>
      </Dropzone>
      <LanguageSwitcher openOnTop
                        onChange={handleLanguageSwitch}
                        langtag={langtag}
                        options={langOptions.map((lt) => ({value: lt, label: lt}))}
      />
    </div>
  );
};

export default compose(
  pure,
  withAbortableXhrRequests,
  enhance,
  translate(["media"])
)(MultilangFileDropzone);

MultilangFileDropzone.propTypes = {
  file: PropTypes.object.isRequired
};

