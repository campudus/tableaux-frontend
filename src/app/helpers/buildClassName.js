export const buildClassName = (base, modifiers = {}, additionals) => {
  const bemModifiers = Object.entries(modifiers || {})
    .filter(([_, isActive]) => isActive) // eslint-disable-line no-unused-vars
    .map(([modifier, _]) => `${base}--${modifier}`); // eslint-disable-line no-unused-vars
  const additionalsList =
    typeof additionals === "string"
      ? [additionals]
      : Array.isArray(additionals)
      ? additionals
      : [];

  return [base, ...bemModifiers, ...additionalsList].join(" ").trim();
};
