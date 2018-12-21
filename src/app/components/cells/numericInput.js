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
  console.log("has Comma", oldValue, hasComma);
  const allowedKeyStrokes = [
    ...(hasComma ? allowedSymbols.substr(2) : allowedSymbols),
    ...allowedKeys
  ];
  if (
    !(event.altKey || event.ctrlKey) &&
    !contains(event.key, allowedKeyStrokes)
  ) {
    console.log(
      "Prevented keystroke:",
      event.altKey ? "[alt] + " : "",
      event.ctrlKey ? "[ctrl] + " : "",
      event.key
    );
    event.preventDefault();
    event.stopPropagation();
  }
};
