import { ReactElement, useState } from "react";
import { useIntersectionObserver } from "usehooks-ts";
import { Attachment } from "../../types/grud";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import { buildClassName as cn } from "../../helpers/buildClassName";
import apiUrl from "../../helpers/apiUrl";
import { Layout } from "./folder/FolderToolbar";

const VALID_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff"
];

const FALLBACK_EXTENSIONS = [
  "pdf",
  "mp4",
  "jpg",
  "png",
  "json",
  "xlsx",
  "docx"
];

type MediaThumbnailProps = {
  className?: string;
  langtag: string;
  dirent?: Attachment;
  layout?: Layout | "table";
  width?: number;
};

export function MediaThumbnailFolder({
  className,
  layout = "list",
  icon = "folder"
}: MediaThumbnailProps & { icon?: "folder" | "folder-back" }): ReactElement {
  return (
    <div className={cn("media-thumbnail", { [layout]: true }, className)}>
      <img
        className={cn("media-thumbnail__image", { icon: true, [icon]: true })}
        src={`/img/icons/${icon}.svg`}
      />
    </div>
  );
}

export default function MediaThumbnail({
  className,
  langtag,
  dirent,
  layout = "list",
  width = 40
}: MediaThumbnailProps): ReactElement {
  const { isIntersecting, ref } = useIntersectionObserver();
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const translate = retrieveTranslation(langtag);
  const mimeType = translate(dirent?.mimeType);
  const internalName = translate(dirent?.internalName);
  const extension = internalName?.split(".")[1]?.toLowerCase();
  const isValidMimeType = VALID_MIME_TYPES.includes(mimeType);
  const isSVG = mimeType === "image/svg+xml";
  const imageUrl = apiUrl(translate(dirent?.url));
  const thumbnailUrl = isSVG ? imageUrl : `${imageUrl}?width=${width}`;
  const hasFallback = FALLBACK_EXTENSIONS.includes(extension);
  const fallbackUrl = `/img/fileicons/${extension}.svg`;
  const canShowImage = !isError && (isValidMimeType || isSVG);

  return (
    <div
      ref={ref}
      className={cn("media-thumbnail", { [layout]: true }, className)}
    >
      <span className="media-thumbnail__overlay">
        <i className="icon fa fa-external-link" />
      </span>

      {isLoading && <div className="media-thumbnail__skeleton"></div>}

      {isIntersecting && canShowImage && (
        <img
          className={cn("media-thumbnail__image", {
            icon: isSVG,
            custom: isSVG
          })}
          src={thumbnailUrl}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsError(true)}
        />
      )}

      {isIntersecting && !canShowImage && hasFallback && (
        <img
          className={cn("media-thumbnail__image", { icon: true })}
          src={fallbackUrl}
        />
      )}

      {isIntersecting && !canShowImage && !hasFallback && (
        <svg
          className={cn("media-thumbnail__image", { icon: true })}
          width="20"
          height="28"
          viewBox="0 0 20 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_1472_19329)">
            <path
              d="M0 1.4C0 0.626802 0.596954 0 1.33333 0H14L20 6V26.6C20 27.3732 19.403 28 18.6667 28H1.33333C0.596954 28 0 27.3732 0 26.6V1.4Z"
              fill="white"
            />
            <path
              d="M0 26.5996V1.40039C0 0.627306 0.596778 0.000184711 1.33301 0H14L20 6V26.5996C20 27.3246 19.4752 27.9216 18.8027 27.9932L18.667 28V27.2998C18.9849 27.2996 19.2998 27.0186 19.2998 26.5996V6.29004L13.71 0.700195H1.33301C1.01513 0.700387 0.700195 0.981358 0.700195 1.40039V26.5996C0.700195 27.0186 1.01513 27.2996 1.33301 27.2998V28C0.596778 27.9998 0 27.3727 0 26.5996ZM18.667 27.2998V28H1.33301V27.2998H18.667Z"
              fill="#808080"
            />
            <path
              d="M14 0L20 6H15C14.4477 6 14 5.55228 14 5V0Z"
              fill="#808080"
            />
            <path
              d="M10.4677 14.5363H8.96909C8.97357 14.1196 9.00941 13.7702 9.07661 13.4879C9.14382 13.2012 9.25582 12.9413 9.41263 12.7083C9.57392 12.4754 9.78674 12.2289 10.0511 11.9691C10.2572 11.772 10.4431 11.586 10.6089 11.4113C10.7746 11.2321 10.9068 11.0439 11.0054 10.8468C11.1039 10.6452 11.1532 10.4144 11.1532 10.1546C11.1532 9.87231 11.1062 9.63262 11.0121 9.43548C10.918 9.23835 10.7791 9.08826 10.5954 8.98522C10.4162 8.88217 10.1922 8.83065 9.92339 8.83065C9.69937 8.83065 9.4888 8.87545 9.29167 8.96505C9.09453 9.05018 8.93548 9.18459 8.81452 9.36828C8.69355 9.54749 8.62858 9.78495 8.61962 10.0806H7C7.00896 9.51613 7.14337 9.04122 7.40323 8.65591C7.66308 8.27061 8.01254 7.98163 8.45161 7.78898C8.89068 7.59633 9.38127 7.5 9.92339 7.5C10.5237 7.5 11.0367 7.60305 11.4624 7.80914C11.888 8.01075 12.2128 8.30645 12.4368 8.69624C12.6653 9.08154 12.7796 9.54749 12.7796 10.0941C12.7796 10.4884 12.7012 10.8468 12.5444 11.1694C12.3875 11.4875 12.1837 11.7854 11.9328 12.0632C11.6819 12.3365 11.4108 12.6098 11.1196 12.8831C10.8687 13.1116 10.6985 13.3602 10.6089 13.629C10.5193 13.8934 10.4722 14.1958 10.4677 14.5363ZM8.83468 16.6331C8.83468 16.3911 8.91756 16.1873 9.08333 16.0215C9.2491 15.8513 9.47536 15.7661 9.7621 15.7661C10.0488 15.7661 10.2751 15.8513 10.4409 16.0215C10.6066 16.1873 10.6895 16.3911 10.6895 16.6331C10.6895 16.875 10.6066 17.0811 10.4409 17.2513C10.2751 17.4171 10.0488 17.5 9.7621 17.5C9.47536 17.5 9.2491 17.4171 9.08333 17.2513C8.91756 17.0811 8.83468 16.875 8.83468 16.6331Z"
              fill="#808080"
            />
            <text
              fill="#333333"
              fontFamily="Roboto, Helvetica Neue, Helvetica, Arial, sans-serif"
              fontWeight={500}
              fontSize={6}
              x="10"
              y="24"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {extension?.toUpperCase()}
            </text>
          </g>
          <defs>
            <clipPath id="clip0_1472_19329">
              <rect width="20" height="28" fill="white" />
            </clipPath>
          </defs>
        </svg>
      )}
    </div>
  );
}
