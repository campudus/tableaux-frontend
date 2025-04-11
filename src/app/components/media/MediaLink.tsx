import { PropsWithChildren, ReactElement } from "react";
import { Attachment } from "../../types/grud";
import Empty from "../helperComponents/emptyEntry";
import apiUrl from "../../helpers/apiUrl";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import { buildClassName as cn } from "../../helpers/buildClassName";

type MediaLinkProps = PropsWithChildren<{
  className?: string;
  langtag: string;
  file: Attachment;
}>;

export default function MediaLink({
  className,
  langtag,
  file,
  children
}: MediaLinkProps): ReactElement {
  const url = apiUrl(retrieveTranslation(langtag)(file.url));

  return (
    <a
      className={cn("media-link", {}, className)}
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children || <Empty />}
    </a>
  );
}
