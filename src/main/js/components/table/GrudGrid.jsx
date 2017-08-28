/**
 * Some hacks into react-virtualized.Grid to delay rendering of grid elements after scrolling, as only
 * Chromium-based browsers are fast enough to handle scrolling the whole content.
 * Debouncing the scroll handler also debounces rendering.
 */

import {Grid, MultiGrid} from "react-virtualized";
import {add, compose, debounce, update} from "lodash/fp";
import ReactDOM from "react-dom";
import {spinnerOn, spinnerOff} from "../../actions/ActionCreator";

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
  } else {
    this._originalScrollHandler(trigger);
  }
};

export default class GrudGrid extends MultiGrid {

  blgParent = null;
  trgParent = null;

  recalculateScrollPosition = debounce(
    50,
    (newPosition) => {
      this.translateElement(this._blgParent, null);
      this.translateElement(this._trgParent, null);
      this.setState(
        newPosition,
        () => {
          this.props.fullyLoaded && spinnerOff();
        }
      );
    }
  );

  translateElement(element, position) {
    if (element && element.firstChild) {
      if (position) {
        devLog("Setting fake scroll")
        element.firstChild.style.transform = position;
      } else {
        devLog("Deleting fake scroll")
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
