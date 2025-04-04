import f from "lodash/fp";
import { ReactElement, useRef } from "react";
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
  const fileIds = media.data.files?.map(({ uuid }) => uuid) ?? [];
  const oldFileIds = useRef(fileIds);
  const modifiedFileIds = f.difference(fileIds, oldFileIds.current);

  const handleLanguageSwitch = (newLangtag: string) => {
    switchLanguageHandler(history, newLangtag);
  };

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
