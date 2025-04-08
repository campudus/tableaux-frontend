import f from "lodash/fp";
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
  const fileIds = media.data.files?.map(({ uuid }) => uuid) ?? [];
  const prevFolder = useRef(folder);
  const prevFolderId = prevFolder.current.id;
  const prevFileIds = prevFolder.current.files?.map(({ uuid }) => uuid) ?? [];
  const modifiedFileIds =
    prevFolderId === folder.id ? f.difference(fileIds, prevFileIds) : [];

  const handleLanguageSwitch = (newLangtag: string) => {
    switchLanguageHandler(history, newLangtag);
  };

  useEffect(() => {
    prevFolder.current = folder;
  }, [folder]);

  if (media.error) {
    simpleError();
  }

  return (
    <div>
      <GrudHeader
        langtag={langtag}
        handleLanguageSwitch={handleLanguageSwitch}
      />
      {media.finishedLoading ? (
        <Folder
          langtag={langtag}
          folder={media.data}
          modifiedFileIds={modifiedFileIds}
        />
      ) : (
        <Spinner isLoading />
      )}
    </div>
  );
}
