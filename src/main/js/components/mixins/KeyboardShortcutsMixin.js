/*
 Author: github.com/simenbrekken
 Comment: React Keyboard Shortcuts Mixin
 URL: https://gist.github.com/simenbrekken/7f59bae89b6b31cc273e
 */

'use strict';

var _ = require('lodash');

var KEYS = {
  enter : 13,
  left : 37,
  right : 39,
  up : 38,
  down : 40,
  escape : 27,
  backspace : 8,
  comma : 188,
  shift : 16,
  control : 17,
  command : 91,
  tab : 9
  //text
  //use text key handler for any letter or number
};

var KeyboardShortcutsMixin = {
  onKeyboardShortcut : function (event) {
    if (typeof this.getKeyboardShortcuts !== "function") {
      throw "Define function getKeyboardShortcuts in order to use KeyboardShortcutsMixin.";
    }

    var shortcuts = this.getKeyboardShortcuts();
    var shortcutFound = false;

    if (typeof shortcuts !== "object") {
      throw "Return type of getKeyboardShortcuts must be an object.";
    }

    _.forEach(shortcuts, function (handler, key) {
      var keyCode = KEYS[key] || key;

      if (keyCode === event.keyCode) {
        shortcutFound = true;
        handler(event);
      }
    });

    //no shortcut found - check for general letters and call 'text' listener
    if (!shortcutFound && shortcuts.text && isText(event.keyCode)) {
      shortcuts.text(event);
    } else if (!shortcutFound) {
      shortcuts.rest(event);
    }
  }
};

function isText(keyCode) {
  var k = keyCode;
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

module.exports = KeyboardShortcutsMixin;