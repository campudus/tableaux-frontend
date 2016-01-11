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
};

var KeyboardShortcutsMixin = {
  onKeyboardShortcut : function (event) {
    if (typeof this.getKeyboardShortcuts !== "function") {
      throw "Define function getKeyboardShortcuts in order to use KeyboardShortcutsMixin.";
    }

    var shortcuts = this.getKeyboardShortcuts();

    if (typeof shortcuts !== "object") {
      throw "Return type of getKeyboardShortcuts must be an object.";
    }

    _.forEach(shortcuts, function (handler, key) {
      var keyCode = KEYS[key] || key;

      if (keyCode === event.keyCode) {
        handler(event);
      }
    });
  }
};

module.exports = KeyboardShortcutsMixin;