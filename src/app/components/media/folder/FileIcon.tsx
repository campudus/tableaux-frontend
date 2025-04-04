import { ReactElement } from "react";

type FileIconProps = {
  name?: string;
};

export default function FileIcon({ name }: FileIconProps): ReactElement {
  const extension = name
    ?.split(".")
    .map(ext => ext.toLowerCase())
    .at(1);

  return (
    <span className="file-icon">
      {extension ? (
        <img
          src={`/img/filetypes/${extension}-icon-128x128.png`}
          alt={extension}
        />
      ) : (
        <span className="fa-stack empty-icon">
          <i className="fa fa-file-o fa-stack-2x" />
          <i className="fa fa-plus fa-stack-1x" />
        </span>
      )}
    </span>
  );
}
