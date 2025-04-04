import { PropsWithChildren, ReactElement } from "react";
import { Attachment } from "../../types/grud";
import Empty from "../helperComponents/emptyEntry";
import apiUrl from "../../helpers/apiUrl";
import { retrieveTranslation } from "../../helpers/multiLanguage";

type MediaLinkProps = PropsWithChildren<{
  langtag: string;
  file: Attachment;
}>;

export default function MediaLink({
  langtag,
  file,
  children
}: MediaLinkProps): ReactElement {
  const url = apiUrl(retrieveTranslation(langtag)(file.url));

  return (
    <a href={url} rel="noopener noreferrer" target="_blank">
      {children || <Empty />}
    </a>
  );
}
