import f from "lodash/fp";
import { Attachment } from "../types/grud";

export const isImageAttachment = (attachment: Attachment): boolean => {
  const mimeType = f.first(Object.values(attachment.mimeType));
  return mimeType ? mimeType.startsWith("image/") : false;
};
