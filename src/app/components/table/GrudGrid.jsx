/**
 * Some hacks into react-virtualized.Grid to delay rendering of grid elements after scrolling, as only
 * Chromium-based browsers are fast enough to handle scrolling the whole content.
 * Debouncing the scroll handler also debounces rendering.
 */

import { Grid, MultiGrid } from "react-virtualized";
import f from "lodash/fp";
import ReactDOM from "react-dom";
// import {spinnerOn, spinnerOff} from "../../actions/ActionCreator";
import { Subject } from "rxjs";
import { bufferCount, map } from "rxjs/operators";
import DebouncedFunction from "../../helpers/DebouncedFunction";

console.warn(
  "Importing this file will change the behaviour of react-virtualize's Grid component by monkey-patching " +
    "its prototype.\n" +
    "For an unaltered version, don't import react-virtualize.Grid, but GrudGrid.Grid."
);

const handleScrollLater = new DebouncedFunction(function(self, scrollPosition) {
  self._originalScrollHandler(scrollPosition);
});

const scrollingEvents = new Subject();
const IMMEDIATE_RENDER_SPEED = 8; // px/scroll event
const IMMEDIATE_RENDER_FRAMES = 3; // minimum number of frames

const getScrollingVelocity = ([[x1, y1], [x2, y2]]) => {
  // implicit differentiation of position to velocity
  const xx = [x2 - x1, y2 - y1].map(x => x * x).reduce(f.add);
  return Math.sqrt(xx);
};

// implicitly differentiate velocity to get current scrolling acceleration, then
// simultaneously test if velocity is below threshold and acceleration <= 0
const isDecelerating = ([v1, v2]) =>
  v2 <= v1 && v1 <= IMMEDIATE_RENDER_SPEED && v2 <= IMMEDIATE_RENDER_SPEED;

// If during the last IMMEDIATE_RENDER_FRAMES scroll events scrolling speed was lower than IMMEDIATE_RENDER_SPEED
// and no positive acceleration occurred, immediately render the visible portion of the table.
scrollingEvents
  .pipe(
    bufferCount(2, 1),
    map(getScrollingVelocity),
    bufferCount(2, 1),
    map(isDecelerating),
    bufferCount(IMMEDIATE_RENDER_FRAMES, 1)
  )
  .subscribe(history => {
    if (f.every(f.identity, history)) {
      handleScrollLater.flush();
    }
  });

Grid.prototype._originalScrollHandler = Grid.prototype.handleScrollEvent;

Grid.prototype.handleScrollEvent = function(trigger) {
  if (!this._mainGridNode || !this.leftGridNode) {
    const gridNode = document.getElementsByClassName("ReactVirtualized__Grid");
    this._mainGridNode = gridNode[3];
    this.leftGridNode = gridNode[2];
  }
  const scrollInfo = {
    scrollTop: trigger.scrollTop,
    scrollLeft: trigger.scrollLeft
  };

  if (trigger === this._mainGridNode || trigger === this.leftGridNode) {
    this.props.onScroll(scrollInfo);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    handleScrollLater.start(self, scrollInfo);
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
  _brgParent = null;
  hovered = null;

  recalculateScrollPosition = new DebouncedFunction(newPosition => {
    this.translateElement(this._blgParent, null);
    this.translateElement(this._brgParent, null);
    this.translateElement(this._trgParent, null);
    this.setState(newPosition);
  });

  translateElement(element, transformation) {
    if (element && element.firstChild) {
      if (transformation) {
        element.firstChild.style.transform = transformation;
      } else {
        element.firstChild.style.removeProperty("transform");
      }
    }
  }

  _onScroll(scrollInfo) {
    const { scrollLeft, scrollTop } = scrollInfo;
    if (this.props.onScroll && typeof this.props.onScroll === "function") {
      this.props.onScroll({ scrollLeft, scrollTop });
    }
    if (!this._trgParent) {
      // eslint-disable-next-line react/no-find-dom-node
      this._trgParent = ReactDOM.findDOMNode(this._topRightGrid);
    }
    if (!this._blgParent) {
      // eslint-disable-next-line react/no-find-dom-node
      this._blgParent = ReactDOM.findDOMNode(this._bottomLeftGrid);
    }
    if (!this._brgParent) {
      // eslint-disable-next-line react/no-find-dom-node
      this._brgParent = ReactDOM.findDOMNode(this._bottomRightGrid);
    }

    const y = this.state.scrollTop - scrollTop;
    const x = this.state.scrollLeft - scrollLeft;

    // only the bottom right grid is scrollable, so always adapt the bottom-left and top-right
    this.translateElement(this._blgParent, `translateY(${y}px)`);
    this.translateElement(this._trgParent, `translateX(${x}px)`);
    this.recalculateScrollPosition.start({ scrollLeft, scrollTop });
  }

  componentWillUnmount() {
    handleScrollLater.cancel();
    this.recalculateScrollPosition.cancel();
  }
}

class VanillaGrid extends Grid {
  handleScrollEvent = this._originalScrollHandler;
}

export { VanillaGrid as Grid };
