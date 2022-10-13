// getCssVar : String -> String
export const getCssVar = varName =>
  getComputedStyle(document.body).getPropertyValue(varName);

// getCssVarNumeric : String -> Number
export const getCssVarNumeric = varName => parseInt(getCssVar(varName)) || 0;
