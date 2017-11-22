import React from "react";
import MediaLink from "../MediaLink";
import f from "lodash/fp";
import {hasUserAccessToLanguage} from "../../../helpers/accessManagementHelper";
import {branch, compose, pure, renderNothing, withStateHandlers} from "recompose";
import {getLanguageOrCountryIcon} from "../../../helpers/multiLanguage";
import LanguageSwitcher from "../../header/LanguageSwitcher";
import FileChangeUpload from "./FileChangeUpload";
import {translate} from "react-i18next";

const enhance = compose(
  branch(
    (props) => !props.hasContent && f.isEmpty(props.unsetLangs),
    renderNothing
  ),
  withStateHandlers(
    ({fileLangtag, unsetLangs}) => ({fileLangtag: fileLangtag || f.first(unsetLangs)}),
    {
      setTitle: ({fileLangtag}, {setFileAttribute}) => (event) => setFileAttribute("title", fileLangtag, event.target.value),
      setDescription: ({fileLangtag}, {setFileAttribute}) => (event) => setFileAttribute("description", fileLangtag, event.target.value),
      setExternalName: ({fileLangtag}, {setFileAttribute}) => (event) => setFileAttribute("externalName", fileLangtag, event.target.value),
      switchLang: () => (fileLangtag) => ({fileLangtag})
    }
  ),
  translate(["media"])
);

const MultifileFileEdit = (props) => {
  const {langtag, file, hasContent, file: {uuid, internalName}, fileAttributes, fileLangtag, unsetLangs, switchLang, t} = props;
  const mayChange = hasUserAccessToLanguage(langtag);
  return (
    <div className="multifile-file-edit item">
      <div className="cover-wrapper">
        <div className="cover">
          <FileChangeUpload langtag={fileLangtag}
                            internalFileName={internalName[fileLangtag]}
                            uuid={uuid} />
        </div>
        <span className="open-file">
          <MediaLink file={file}
                     langtag={fileLangtag}
          >
            {t("open_file")}
          </MediaLink>
        </span>
      </div>

      <div className="properties-wrapper">
        {(hasContent)
          ? getLanguageOrCountryIcon(fileLangtag)
          : (
            <LanguageSwitcher langtag={fileLangtag}
                              onChange={props.switchLang}
                              options={unsetLangs
                                .filter(hasUserAccessToLanguage)
                                .map((lt) => ({value: lt, label: lt}))
                              }
            />
          )
        }

        <div className="item">
          <div className="item-header">{t("file_title_label")}</div>
          <input disabled={!mayChange}
                 type="text"
                 value={f.getOr("", ["title", fileLangtag], fileAttributes)}
                 onChange={props.setTitle} />
        </div>

        <div className="item">
          <div className="item-header">{t("file_description_label")}</div>
          <input disabled={!mayChange}
                 type="text"
                 value={f.getOr("", ["description", fileLangtag], fileAttributes)}
                 onChange={props.setDescription} />
        </div>

        <div className="item">
          <div className="item-header">{t("file_link_name_label")}</div>
          <input disabled={!mayChange}
                 type="text"
                 value={f.getOr("", ["externalName", fileLangtag], fileAttributes)}
                 onChange={props.setExternalName} />
        </div>
      </div>

    </div>
  );
};

export default enhance(MultifileFileEdit);
