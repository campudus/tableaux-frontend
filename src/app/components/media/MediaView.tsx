import f from "lodash/fp";
import i18n from "i18next";
import { ReactElement, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { switchLanguageHandler } from "../Router";
import GrudHeader from "../GrudHeader";
import Folder from "./folder/Folder";
import Spinner from "../header/Spinner";
import { MediaState } from "../../redux/reducers/media";
import { simpleError } from "../overlay/ConfirmationOverlay";

type ReduxState = { media: MediaState };

type MediaViewProps = {
  langtag: string;
  folderId?: string;
};

export default function MediaView({ langtag }: MediaViewProps): ReactElement {
  const history = useHistory();
  const media = useSelector<ReduxState, MediaState>(state => state.media);
  const folder = media.data;
  const folderPrev = useRef(folder);
  const folderIdPrev = folderPrev.current.id;
  const fileIds = media.data.files?.map(({ uuid }) => uuid) ?? [];
  const fileIdsPrev = folderPrev.current.files?.map(({ uuid }) => uuid) ?? [];
  const fileIdsDiff =
    folderIdPrev === folder.id ? f.difference(fileIds, fileIdsPrev) : [];

  const handleLanguageSwitch = (newLangtag: string) => {
    switchLanguageHandler(history, newLangtag);
  };

  useEffect(() => {
    folderPrev.current = folder;
  }, [folder]);

  if (media.error) {
    simpleError();
  }

  return (
    <>
      <GrudHeader
        langtag={langtag}
        handleLanguageSwitch={handleLanguageSwitch}
      />

      {!media.finishedLoading && <Spinner isLoading />}

      <div className="media-view">
        <div className="media-view__card">
          <h4 className="media-view__title">{i18n.t("media:title")}</h4>

          <Folder
            langtag={langtag}
            folder={media.data}
            fileIdsDiff={fileIdsDiff}
          />
        </div>
      </div>
    </>
  );
}
