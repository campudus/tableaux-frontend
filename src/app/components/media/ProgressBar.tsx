import f from "lodash/fp";
import { ReactElement } from "react";

type ProgressBarProps = {
  progress?: number;
};

export default function ProgressBar({
  progress = 0
}: ProgressBarProps): ReactElement {
  const completed = f.clamp(0, 100, Math.round(progress));

  return (
    <div className="progressbar">
      <div
        className="progressbar-progress"
        style={{ width: `${completed}%`, transition: "width 100ms" }}
      >
        {`${completed}%`}
      </div>
    </div>
  );
}
