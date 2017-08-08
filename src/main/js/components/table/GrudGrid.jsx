import {MultiGrid, Grid} from "react-virtualized";
import {debounce, throttle} from "lodash/fp";
import ReactDOM from "react-dom";

Grid.prototype._originalScrollHandler = Grid.prototype.handleScrollEvent;
Grid.handleScrollEvent = throttle(20,
  function (scrollInfo) {
    this._originalScrollHandler(scrollInfo);
  }
);

export default class GrudGrid extends MultiGrid {
  constructor(props) {
    super(props);
    this._originalScrollHandler = this._onScroll;
    this.scrollInfo = {};
  }

  componentWillMount() {
    this._onScroll = this.smoothScrollHandler;
    super.componentWillMount();
  }

  quicklyUpdateScrollPosition = () => {
    if (!this.blgNode || !this.brgNode || !this.trgNode) {
      this.blgNode = ReactDOM.findDOMNode(this._bottomLeftGrid);
      this.brgNode = ReactDOM.findDOMNode(this._bottomRightGrid);
      this.trgNode = ReactDOM.findDOMNode(this._topRightGrid);
    }
    const {scrollLeft, scrollTop} = this.scrollInfo;
    if (this.blgNode.scrollTop !== scrollTop) this.blgNode.scrollTop = scrollTop;
    if (this.trgNode.scrollLeft !== scrollLeft) this.trgNode.scrollLeft = scrollLeft;
  };

  updateScrollPosition = debounce(50,
    () => {
      this._originalScrollHandler(this.scrollInfo);
    }
  );

  _onScrollLeft() {}
  _onScrollTop() {}

  smoothScrollHandler = (scrollInfo) => {
    this.scrollInfo = scrollInfo;
    window.requestAnimationFrame(this.quicklyUpdateScrollPosition);
    this.updateScrollPosition();
  }
}
