export const getModifiers = evt => {
  const isMac = navigator.userAgent.includes("Mac OS");
  const modKey = isMac ? "Meta" : "Control";

  const shift = Boolean(evt?.getModifierState("Shift"));
  const alt = Boolean(evt?.getModifierState("Alt"));
  const mod = Boolean(evt?.getModifierState(modKey));
  const none = !alt && !shift && !mod;

  return {
    shift,
    alt,
    mod,
    none
  };
};
