import i18n from "i18next";
import { ChangeEvent, PropsWithChildren, ReactElement } from "react";
import { FilterModes } from "../../../constants/TableauxConstants";
import ButtonAction, {
  ButtonActionOption
} from "../../helperComponents/ButtonAction";
import { FILTER_MODE_DEFAULT, FilterMode } from "./AttachmentOverlay";

type AttachmentFilterProps = PropsWithChildren<{
  value?: string;
  mode?: FilterMode;
  onUpdateValue: (value: string) => void;
  onUpdateMode: (mode: FilterMode) => void;
}>;

export default function AttachmentFilter({
  value,
  mode = FILTER_MODE_DEFAULT,
  onUpdateValue,
  onUpdateMode
}: AttachmentFilterProps): ReactElement {
  const modeOptions: (ButtonActionOption & { mode: FilterMode })[] = [
    {
      mode: FilterModes.CONTAINS,
      label: i18n.t("table:filter.contains"),
      onClick: () => onUpdateMode(FilterModes.CONTAINS)
    },
    {
      mode: FilterModes.STARTS_WITH,
      label: i18n.t("table:filter.starts_with"),
      onClick: () => onUpdateMode(FilterModes.STARTS_WITH)
    }
  ];
  const modeOption = modeOptions.find(opt => opt.mode === mode);
  const modePlaceholder = modeOption?.label as string;

  const handleUpdateValue = (event: ChangeEvent<HTMLInputElement>) => {
    onUpdateValue(event.target.value);
  };

  return (
    <div className="attachment-filter">
      <input
        className="attachment-filter__input"
        type="text"
        placeholder={modePlaceholder}
        value={value ?? ""}
        onChange={handleUpdateValue}
      />
      <ButtonAction
        className="attachment-filter__mode"
        variant="icon"
        alignmentH="left"
        options={modeOptions}
        icon={
          <>
            <i className="fa fa-search" />
            <i className="fa fa-angle-down" />
          </>
        }
      />
    </div>
  );
}
