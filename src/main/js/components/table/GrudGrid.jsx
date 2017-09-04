/**
 * Some hacks into react-virtualized.Grid to delay rendering of grid elements after scrolling, as only
 * Chromium-based browsers are fast enough to handle scrolling the whole content.
 * Debouncing the scroll handler also debounces rendering.
 */

import {Grid, MultiGrid} from "react-virtualized";
import f, {add, compose, debounce, noop, update} from "lodash/fp";
import ReactDOM from "react-dom";
import {spinnerOn, spinnerOff} from "../../actions/ActionCreator";
import Bacon from "baconjs";

console.warn(
  "Importing this file will change the behaviour of \"react-virtualize\"'s Grid component by monkey-patching " +
  "its prototype.\n" +
  "For an unaltered version, don't import react-virtualize.Grid, but GrudGrid.Grid."
);

const handleScrollLater = debounce(
  50,
  function (self, scrollPosition) {
    devLog("Debounced scroll handler executing...")
    self._originalScrollHandler(scrollPosition);
  }
);

const scrollingEvents = new Bacon.Bus();
const IMMEDIATE_RENDER_SPEED = 8;   // px/scroll event
const IMMEDIATE_RENDER_FRAMES = 3;  // minimum number of frames with speed <= IMMEDIATE_RENDER_SPEED and speed not increasing

// Stream: scroll positions [x, y] -> combined scroll speed |[dx, dy]|
const dx = scrollingEvents.diff(
  [0, 0, performance.now()],
  ([x1, y1, t1], [x2, y2, t2]) => {
    const xx = [(x2 - x1), (y2 - y1)]
      .map((x) => x * x)
      .reduce(f.add);
    return Math.sqrt(xx);
  }
);

// Stream: scroll speed -> Bool: is speed decreasing?
const decel = dx.diff(
  0,
  (v1, v2) => v2 <= v1
);

// Stream: (scroll speed x Bool: decrasing) -> void
// Side effect: Immediately render when speed decreasing and total speed < 8px
dx.sampledBy(
    decel,
    (v, decelerating) => decel && v < IMMEDIATE_RENDER_SPEED
  )
  .slidingWindow(IMMEDIATE_RENDER_FRAMES, IMMEDIATE_RENDER_FRAMES)
  .onValue(
    (history) => {
      if (f.every(f.identity, history)) {
        handleScrollNow();
      }
    }
  );

const handleScrollNow = f.throttle(
  500,
  function () {
    handleScrollLater.flush();
  }
);

Grid.prototype.__originalScrollHandler = Grid.prototype.handleScrollEvent;

Grid.prototype._originalScrollHandler = function (...params) {
  if (ReactDOM.findDOMNode(this._scrollingContainer) === this._mainGridNode) {
    console.log("OriginalScrollHandler")
  }
  this.__originalScrollHandler(...params);
};

Grid.prototype.handleScrollEvent = function (trigger) {
  if (!this._mainGridNode) {
    this._mainGridNode = document.getElementsByClassName("ReactVirtualized__Grid")[3];
  }
  const scrollInfo = {
    scrollTop: trigger.scrollTop,
    scrollLeft: trigger.scrollLeft
  };

  if (trigger === this._mainGridNode) {
    this.props.onScroll(scrollInfo);
    const self = this;
    handleScrollLater(self, scrollInfo);
    scrollingEvents.push([trigger.scrollLeft, trigger.scrollTop]);
  } else {
    this._originalScrollHandler(trigger);
  }
};

export default class GrudGrid extends MultiGrid {
  _blgParent = null;
  _trgParent = null;
  correctionStep = false;

  recalculateScrollPosition = debounce(
    50,
    (newPosition) => {
      this.correctionStep = !this.correctionStep;
      const maybeCorrectScrollPos = (this.correctionStep)
        ? noop
        : () => {
          requestAnimationFrame(
            () => {
              this.setState(
                compose(
                  update("scrollTop", add(-1)),
                  update("scrollLeft", add(-1))
                )
              );
            }
          );
        };
      this.translateElement(this._blgParent, null);
      this.translateElement(this._trgParent, null);
      this.setState(
        newPosition,
        () => {
          this.props.fullyLoaded && spinnerOff();
          maybeCorrectScrollPos();
        }
      );
    }
  );

  translateElement(element, position) {
    if (element && element.firstChild) {
      if (position) {
        element.firstChild.style.transform = position;
      } else {
        element.firstChild.style.removeProperty("transform");
      }
    }
  }

  _onScroll({scrollLeft, scrollTop}) {
    spinnerOn();
    if (!this._trgParent) {
      this._blgParent = ReactDOM.findDOMNode(this._bottomLeftGrid);
      this._trgParent = ReactDOM.findDOMNode(this._topRightGrid);
    }

    const y = this.state.scrollTop - scrollTop;
    const x = this.state.scrollLeft - scrollLeft;

    this.translateElement(this._blgParent, `translateY(${y}px)`);
    this.translateElement(this._trgParent, `translateX(${x}px)`);
    this.recalculateScrollPosition({scrollLeft, scrollTop});
  }
}

class VanillaGrid extends Grid {
  handleScrollEvent = this._originalScrollHandler;
}

export {VanillaGrid as Grid};
