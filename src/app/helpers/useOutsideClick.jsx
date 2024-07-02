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

const outsideClickEffect = ({
  shouldListen, // Boolean
  containerRef, // React.leagacyRef
  onOutsideClick // Html.Event -> ()
}) => () => {
  if (shouldListen && containerRef.current) {
    const handleOutsideClick = event => {
      if (!containerRef.current?.contains(event.target)) onOutsideClick(event);
    };
    const handleCleanUp = () => {
      document.removeEventListener("click", handleOutsideClick);
    };
    document.addEventListener("click", handleOutsideClick);
    return handleCleanUp;
  }
};

export { outsideClickEffect };
