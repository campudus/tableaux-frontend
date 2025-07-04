import { ReactElement } from "react";
import GrudHeader from "../GrudHeader";
import { switchLanguageHandler } from "../Router";

type PreviewViewProps = {
  langtag: string;
};

export default function PreviewView({
  langtag
}: PreviewViewProps): ReactElement {
  const handleLanguageSwitch = (newLangtag: string) => {
    switchLanguageHandler(history, newLangtag);
  };

  return (
    <>
      <GrudHeader
        langtag={langtag}
        handleLanguageSwitch={handleLanguageSwitch}
      />

      <div className="preview-view">
        <h4 className="preview-view__title">PreviewCenter</h4>
      </div>
    </>
  );
}
