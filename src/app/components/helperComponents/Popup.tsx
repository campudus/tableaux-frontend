import {
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useEffect,
  useRef,
  useState
} from "react";
import { outsideClickEffect } from "../../helpers/useOutsideClick";

type PopupProps = PropsWithChildren<{
  className?: string;
  trigger: ReactNode;
  testId?: string;
}>;

export default function Popup({
  className = "",
  trigger,
  children,
  testId
}: PopupProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const closePopup = () => {
    setIsOpen(false);
  };

  const togglePopup = () => {
    setIsOpen(open => !open);
  };

  useEffect(
    outsideClickEffect({
      shouldListen: true,
      containerRef,
      onOutsideClick: closePopup
    }),
    [containerRef.current]
  );

  return (
    <div
      ref={containerRef}
      style={{ cursor: "pointer" }}
      className={`${className} ${isOpen ? "popup-open" : ""}`}
      onClick={togglePopup}
      data-testid={testId}
    >
      {trigger}
      {isOpen && children}
    </div>
  );
}
