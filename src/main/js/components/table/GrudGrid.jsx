/**
 * Some hacks into react-virtualized.Grid to delay rendering of grid elements after scrolling, as only
 * Chromium-based browsers are fast enough to handle scrolling the whole content.
 * Debouncing the scroll handler also debounces rendering. The downside of this is that syncing of fixed
 * rows and columns also gets debounced.
 */

import {Grid, MultiGrid} from "react-virtualized";
import {debounce} from "lodash/fp";
import ReactDOM from "react-dom";

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
  brgParent = null;

  recalculateScrollPosition = debounce(
    50,
    (newPosition) => {
      this.setState(
        newPosition,
        () => {
          this.translateElement(this.blgParent, "");
          this.translateElement(this.trgParent, "");
        }
      );
    }
  );

  translateElement(element, position) {
    if (element && element.firstChild) {
      element.firstChild.style.transform = position;
    }
  }

  _onScroll(scrollInfo) {
    if (!this._tlgParent) {
      this._blgParent = ReactDOM.findDOMNode(this._bottomLeftGrid);
      this._trgParent = ReactDOM.findDOMNode(this._topRightGrid);
      this._brgParent = ReactDOM.findDOMNode(this._bottomRightGrid);
    }

    const {scrollLeft, scrollTop} = scrollInfo;
    this.translateElement(this._blgParent, `translateY(-${scrollTop - this.state.scrollTop}px)`);
    this.translateElement(this._trgParent, `translateX(-${scrollLeft - this.state.scrollLeft}px)`);
    this.recalculateScrollPosition({scrollLeft, scrollTop});
  }
}
