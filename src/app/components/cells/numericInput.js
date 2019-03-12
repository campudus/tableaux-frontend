const allowedSymbols = ".,0123456789";
const allowedKeys = [
  "Enter",
  "Escape",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Backspace"
];
import { contains } from "lodash/fp";

export const filterAllowedKeys = oldValue => event => {
  const hasComma = /[,.]/.test(oldValue);
  const allowedKeyStrokes = [
    ...(hasComma ? allowedSymbols.substr(2) : allowedSymbols),
    ...allowedKeys
  ];
  if (
    !(event.altKey || event.ctrlKey) &&
    !contains(event.key, allowedKeyStrokes)
  ) {
    event.preventDefault();
    event.stopPropagation();
  }
};
