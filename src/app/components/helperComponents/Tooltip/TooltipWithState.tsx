import {
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useCallback,
  useRef,
  useState
} from "react";
import { Portal } from "react-portal";
import Tooltip from "./Tooltip";
import { useDebouncedValue } from "../../../helpers/useDebouncedValue";
import { buildClassName as cn } from "../../../helpers/buildClassName";

type TooltipWithStateProps = PropsWithChildren<{
  className?: string;
  tooltip: ReactNode;
  delayOpen?: number; // in ms
  offsetTop?: number;
  offsetLeft?: number;
}>;

export default function TooltipWithState({
  className,
  children,
  tooltip,
  delayOpen,
  offsetTop = 0,
  offsetLeft = 0
}: TooltipWithStateProps): ReactElement {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const wrapperPosition =
    wrapperRef.current && wrapperRef.current.getBoundingClientRect();
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const debouncedTooltipVisible = useDebouncedValue(tooltipVisible, delayOpen);
  const isVisible = tooltipVisible && debouncedTooltipVisible; // delay on open, but close instantly
  const handleMouseEnter = useCallback(() => setTooltipVisible(true), []);
  const handleMouseLeave = useCallback(() => setTooltipVisible(false), []);

  return (
    <div
      ref={wrapperRef}
      className={cn("tooltip-wrapper", {}, className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && wrapperPosition && (
        <Portal>
          <Tooltip
            defaultInvert
            style={{
              left: wrapperPosition.left + offsetLeft,
              top: wrapperPosition.bottom + offsetTop
            }}
          >
            {tooltip}
          </Tooltip>
        </Portal>
      )}
    </div>
  );
}
