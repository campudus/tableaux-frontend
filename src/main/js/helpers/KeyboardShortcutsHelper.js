/*
 Modified by Campudus
 Original Author: github.com/simenbrekken
 Comment: React Keyboard Shortcuts Mixin
 URL: https://gist.github.com/simenbrekken/7f59bae89b6b31cc273e
 */

"use strict";
import f from "lodash/fp";
const KEYS = {
  enter: 13,
  left: 37,
  right: 39,
  up: 38,
  down: 40,
  escape: 27,
  backspace: 8,
  comma: 188,
  shift: 16,
  control: 17,
  command: 91,
  tab: 9,

  // These optional keys allow to inject further functionality
  text: null, // use text key handler for any letter or number
  always: null, // Bound function gets called on every keyCode. Passes boolean variable shortcutFound
  navigation: null // left, right, down, up, escape
};

const KeyboardShortcutsHelper = {
  onKeyboardShortcut: (keyboardShortcutsFn) => {
    return (event) => {
      _onKeyboardShortcut(event, keyboardShortcutsFn);
    };
  }
};

function _onKeyboardShortcut(event, keyboardShortcutsFn) {
  if (!f.isFunction(keyboardShortcutsFn)) {
    throw new Error("Define function keyboardShortcutsFn in order to use KeyboardShortcutsMixin.");
  }

  let shortcuts = keyboardShortcutsFn();
  let shortcutFound = false;

  if (!f.isObject(shortcuts)) {
    throw new Error("Return type of keyboardShortcutsFn must be an object.");
  }

  if (f.isEmpty(shortcuts)) {
    return;
  }

  f.keys(shortcuts).map(
    function (handler, key) {
      let keyCode = KEYS[key] || key;

      if (keyCode === event.keyCode) {
        shortcutFound = true;
        handler(event);
      }
    }
  );

  // no shortcut found - check for general letters and call 'text' listener
  if (!shortcutFound && shortcuts.text && isText(event.keyCode)) {
    shortcuts.text(event);
  }

  // Navigation key: left, right, down, up, escape. Useful for saving when selecting out
  if (!shortcutFound && shortcuts.navigation && isNavigation(event.keyCode)) {
    shortcuts.navigation(event);
  }

  // Gets called on every keyCode
  if (shortcuts.always) {
    shortcuts.always(event, shortcutFound);
  }
}

export function isNavigation(k) {
  return (k === KEYS.left || k === KEYS.right || k === KEYS.down || k === KEYS.up || k === KEYS.escape || k === KEYS.tab);
}

export function isText(k) {
  /**
   * Cheat Sheet for most important letters in german
   * 32 - 126 key "!" - "~"
   * ,: 188
   * ;: 186
   * .: 190
   * ß: 225, ä: 132, ö: 148, ü: 129, Ä: 142, Ö: 153, Ü: 154
   */
  return ((k >= 32 && k <= 126) || k === 225 || k === 132 || k === 148 || k === 129 || k === 142 || k === 153
  || k === 154 || k === 188 || k === 190 || k === 186);
}

export function isNumber(k) {
  return (k >= 48 && k <= 57) || (k >= 96 && k <= 105);
}

export function isUsefulInputControls(event) {
  const k = event.keyCode;
  console.log("key:", k);
  const ctrlKey = event.ctrlKey;
  return (
    // backspace
    k === 8
      // entf
    || k === 46
      // ctrl + a
    || (k === 65 && ctrlKey)
      // ctrl +c
    || (k === 67 && ctrlKey)
      // ctrl + x
    || (k === 88 && ctrlKey)
      // ctrl + v
    || (k === 86 && ctrlKey)
  );
}

export function isAllowedForNumberInput(event) {
  return isNumber(event.keyCode) || isNavigation(event.keyCode) || isUsefulInputControls(event);
}

/*  For use later
 isKeyCodeCommaOrDot : function (keyEvent) {
 let keyCode = keyEvent.keyCode;
 let shift = keyEvent.shiftKey;
 return (!shift && (keyCode === 188 || keyCode === 110 || keyCode === 190));
 },

 isKeyCodeNumber : function (keyEvent) {
 let keyCode = keyEvent.keyCode;
 let shift = keyEvent.shiftKey;
 return (!shift && ((keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 105)));
 }, */

export default KeyboardShortcutsHelper;
