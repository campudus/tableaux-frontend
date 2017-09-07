/**
 * Some hacks into react-virtualized.Grid to delay rendering of grid elements after scrolling, as only
 * Chromium-based browsers are fast enough to handle scrolling the whole content.
 * Debouncing the scroll handler also debounces rendering.
 */

import {Grid, MultiGrid} from "react-virtualized";
import f, {add, compose, debounce, noop, update} from "lodash/fp";
import ReactDOM from "react-dom";
import {spinnerOn, spinnerOff} from "../../actions/ActionCreator";
import Rx from "rxjs";

console.warn(
  "Importing this file will change the behaviour of \"react-virtualize\"'s Grid component by monkey-patching " +
  "its prototype.\n" +
  "For an unaltered version, don't import react-virtualize.Grid, but GrudGrid.Grid."
);

const handleScrollLater = debounce(
  50,
  function (self, scrollPosition) {
    self._originalScrollHandler(scrollPosition);
  }
);

const scrollingEvents = new Rx.Subject();
const IMMEDIATE_RENDER_SPEED = 8;   // px/scroll event
const IMMEDIATE_RENDER_FRAMES = 3;  // minimum number of frames

const getScrollingVelocity = ([[x1, y1], [x2, y2]]) => { // implicit differentiation of position to velocity
  const xx = [(x2 - x1), (y2 - y1)]
    .map((x) => x * x)
    .reduce(f.add);
  return Math.sqrt(xx);
};

// implicitly differentiate velocity to get current scrolling acceleration, then
// simultaneously test if velocity is below threshold and acceleration <= 0
const isDecelerating = ([v1, v2]) => (
  v2 <= v1
  && v1 <= IMMEDIATE_RENDER_SPEED
  && v2 <= IMMEDIATE_RENDER_SPEED
);

// If during the last IMMEDIATE_RENDER_FRAMES scroll events scrolling speed was lower than IMMEDIATE_RENDER_SPEED
// and no positive acceleration occurred, immediately render the visible portion of the table.
scrollingEvents
  .bufferCount(2, 1)
  .map(getScrollingVelocity)
  .bufferCount(2, 1)
  .map(isDecelerating)
  .bufferCount(IMMEDIATE_RENDER_FRAMES, 1)
  .subscribe(
    (history) => {
      if (f.every(f.identity, history)) {
        handleScrollLater.flush();
      }
    }
  );

Grid.prototype._originalScrollHandler = Grid.prototype.handleScrollEvent;

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
    // Cannot directly subscribe to event stream, as React hijacks this and delivers React.VirtualEvents instead,
    // so manually push data into RxJS stream
    scrollingEvents.next([trigger.scrollLeft, trigger.scrollTop]);
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

const tests = {
  title: "React Virtualized hacks",
  tests: [
    ["is", 5, getScrollingVelocity, [[[0, 3], [4, 0]]]],
    ["is", false, isDecelerating, [[1, 2]]],
    ["is", true, isDecelerating, [[7, 5]]],
    ["is", false, isDecelerating, [[15, 14]]],
    ["is", true, isDecelerating, [[5, 5]]]
  ]
};

export {VanillaGrid as Grid, tests};
