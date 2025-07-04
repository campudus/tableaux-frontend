import { useState } from "react";
import apiUrl from "../../../helpers/apiUrl";
import { Attachment } from "../../../types/grud";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import { buildClassName as cn } from "../../../helpers/buildClassName";

const VALID_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff"
];
const FALLBACK_ICONS = ["pdf", "mp4", "jpg", "png", "json", "xlsx", "docx"];

type FileThumbnailProps = {
  langtag: string;
  file: Attachment;
  width?: number;
};

function FileThumbnail({ langtag, file, width = 40 }: FileThumbnailProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const title = retrieveTranslation(langtag)(file.title);
  const internalName = retrieveTranslation(langtag)(file.internalName);
  const mimeType = retrieveTranslation(langtag)(file.mimeType);
  const extension = internalName?.split(".")[1]?.toLowerCase();
  const imageUrl = apiUrl(retrieveTranslation(langtag)(file.url));
  const thumbnailUrl = `${imageUrl}?width=${width}`;
  const isValidMimeType = VALID_MIME_TYPES.includes(mimeType);
  const hasFallback = FALLBACK_ICONS.includes(extension);
  const fallbackFileName = hasFallback ? extension : "unknown";
  const fallbackUrl = `/img/fileicons/${fallbackFileName}.svg`;
  const showFallback = hasImageError || !isValidMimeType;

  return (
    <span className="file-thumbnail">
      <span className="file-thumbnail__overlay">
        <i className="icon fa fa-external-link" />
      </span>
      <img
        className={cn("file-thumbnail__image", { fallback: showFallback })}
        src={showFallback ? fallbackUrl : thumbnailUrl}
        onError={() => setHasImageError(true)}
        alt={title}
      />
    </span>
  );
}

export default FileThumbnail;
