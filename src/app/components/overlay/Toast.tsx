import { ReactElement, ReactNode, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import actions from "../../redux/actionCreators";

type ToastProps = {
  content: ReactNode;
  duration?: number;
};

const { setTimeout, clearTimeout } = window;

export default function Toast({
  content,
  duration = 2000
}: ToastProps): ReactElement {
  const dispatch = useDispatch();
  const [timeoutId, setTimeoutId] = useState<number>();

  const hideToast = () => {
    dispatch(actions.hideToast());
  };

  const setTimer = () => {
    const timeoutId = setTimeout(hideToast, duration);
    setTimeoutId(timeoutId);
  };

  const clearTimer = () => {
    clearTimeout(timeoutId);
  };

  useEffect(() => {
    clearTimeout(timeoutId);
    setTimer();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [content]);

  return (
    <div
      className="toast-wrapper"
      onMouseOver={clearTimer}
      onMouseOut={setTimer}
    >
      {content}
    </div>
  );
}
