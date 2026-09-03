/*
 * react-onclickoutside won't work with functional components.
 * This is a replacement as suggested by the react-onclickoutside library.
 * It is meant to be used in an useEffect hook, like
 *
 * useEffect(outsideClickEffect({
 *   shouldListen: popupOpen,
 *   containerRef: myRef,
 *   onOutsideClick: closePopup
 * }), [popupOpen, myRef.current])
 *
 * The useEffect's cleanup mechanism will take care of removing event listeners.
 */

// A nested widget can rebuild its own DOM while handling the very click being
// dispatched -- the calendar switching from days to months does. That detaches
// event.target, and `container.contains()` then wrongly reports "outside".
// composedPath() is captured at dispatch time and stays accurate.
const isInside = (container, event) => {
  const path =
    typeof event.composedPath === "function" ? event.composedPath() : null;
  return path ? path.includes(container) : container.contains(event.target);
};

const outsideClickEffect = ({
  shouldListen, // Boolean
  containerRef, // React.leagacyRef
  onOutsideClick // Html.Event -> ()
}) => () => {
  if (shouldListen && containerRef.current) {
    const handleOutsideClick = event => {
      if (!isInside(containerRef.current, event)) onOutsideClick(event);
    };
    const handleCleanUp = () => {
      document.removeEventListener("click", handleOutsideClick);
    };
    document.addEventListener("click", handleOutsideClick);
    return handleCleanUp;
  }
};

export { outsideClickEffect };
