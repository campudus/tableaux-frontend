/**
 * Debounce a function using requestAnimationFrame.
 * More checks than lodash's setTimeout method, but less computational expensive; thus avoiding
 * summing up of delays.
 */

import {maybe} from "./functools";

export default class DebouncedFunction {
  constructor(fn, delay = 50) {
    this._fn = fn;
    this.delay = delay;

    this.time = null;
    this.animationFrameId = null;
  }

  start = (...args) => {
    this.args = args;
    this.time = performance.now();
    if (!this.animationFrameId) {
      requestAnimationFrame(this.run);
    }
  };

  run = () => {
    const now = performance.now();
    if (now - this.time >= this.delay) {
      this.animationFrameId = null;
      if (this._fn) {
        this._fn(...this.args);
      }
    } else {
      this.animationFrameId = requestAnimationFrame(this.run);
    }
  };

  cancel = () => {
    maybe(this.animationFrameId).map(cancelAnimationFrame);
    this.animationFrameId = null;
  };

  flush = () => {
    maybe(this.animationFrameId).map(cancelAnimationFrame);
    this.animationFrameId = null;
    this._fn(...this.args);
  };
}
