import { ReactElement } from "react";
import { ORDER_MODE, ORDER_MODE_DEFAULT, OrderMode } from "./AttachmentOverlay";
import ButtonAction, {
  ButtonActionOption
} from "../../helperComponents/ButtonAction";

type AttachmentOrderProps = {
  mode?: OrderMode;
  onUpdateMode: (mode: OrderMode) => void;
};

export default function AttachmentOrder({
  mode = ORDER_MODE_DEFAULT,
  onUpdateMode
}: AttachmentOrderProps): ReactElement {
  const modeOptions: (ButtonActionOption & { mode: OrderMode })[] = [
    {
      mode: ORDER_MODE.CREATED_AT,
      icon: (
        <span>
          <i className="fa fa-long-arrow-down" />
          <i className="fa fa-clock-o" />
        </span>
      ),
      onClick: () => onUpdateMode(ORDER_MODE.CREATED_AT)
    },
    {
      mode: ORDER_MODE.TITLE,
      icon: <i className="fa fa-sort-alpha-asc" />,
      onClick: () => onUpdateMode(ORDER_MODE.TITLE)
    }
  ];
  const modeOption = modeOptions.find(opt => opt.mode === mode);
  const otherModeOption = modeOptions.find(opt => opt.mode !== mode);

  return (
    <ButtonAction
      className="attachment-order"
      variant="icon"
      alignmentH="left"
      onClick={otherModeOption?.onClick}
      icon={modeOption?.icon}
    />
  );
}
