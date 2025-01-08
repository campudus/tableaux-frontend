// getCssVar : String -> String
export const getCssVar = varName => {
  try {
    return getComputedStyle(document.body).getPropertyValue(varName);
  } catch (err) {
    return null;
  }
};

// getCssVarNumeric : String -> Number
export const getCssVarNumeric = varName => parseInt(getCssVar(varName)) || 0;
