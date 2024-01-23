export const buildClassName = (base, modifiers = {}, additionals) => {
  const bemModifiers = Object.entries(modifiers || {})
    .filter(([_, isActive]) => isActive)
    .map(([modifier, _]) => `${base}--${modifier}`);
  const additionalsList =
    typeof additionals === "string"
      ? [additionals]
      : Array.isArray(additionals)
      ? additionals
      : [];

  return [base, ...bemModifiers, ...additionalsList].join(" ").trim();
};
