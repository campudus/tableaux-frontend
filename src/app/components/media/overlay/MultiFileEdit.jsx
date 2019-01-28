import React from "react";
import f from "lodash/fp";
import { Langtags } from "../../../constants/TableauxConstants";
import MultifileFileEdit from "./MultifileFileEdit";

export default ({ langtag, fileAttributes, file, setFileAttribute }) => {
  const langsWithFiles = lt =>
    f.flow(
      f.props([["externalName", lt], ["title", lt], ["description", lt]]),
      f.any(f.complement(f.isEmpty))
    )(fileAttributes);

  const unsetLangs = f.reject(langsWithFiles, Langtags);

  return (
    <div className="multifile-file-edit-wrapper content-items">
      {Langtags.filter(langsWithFiles).map(lt => (
        <MultifileFileEdit
          key={lt}
          langtag={langtag}
          fileLangtag={lt}
          file={file}
          fileAttributes={fileAttributes}
          setFileAttribute={setFileAttribute}
          hasContent={true}
        />
      ))}
      <MultifileFileEdit
        unsetLangs={unsetLangs}
        langtag={f.head(unsetLangs)}
        fileLangtag={f.head(unsetLangs)}
        file={file}
        fileAttributes={fileAttributes}
        setFileAttribute={setFileAttribute}
        hasContent={false}
      />
    </div>
  );
};
