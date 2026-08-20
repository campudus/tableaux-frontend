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

// A nested widget can restructure its own DOM synchronously in reaction to
// the very click being handled (e.g. a date/time picker switching views, or
// a press-and-hold counter button firing on mousedown before the paired
// click arrives). If that removes event.target from the tree before this
// listener runs, containerRef.contains(event.target) sees a detached node
// and wrongly reports "outside". event.composedPath() is captured at
// dispatch time, before any such mutation, so it stays accurate.
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
