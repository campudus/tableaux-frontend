/**
 * Contains a wrapped <svg> element. Loads svg files per http-requests or from cache if possible. Transforms
 * files to accessible DOM object, so images can be manipulated after loading.
 *
 * Passing a fill=<html-colour> or center={true} property will set appropriate attributes directly to the <svg>
 * tag element; for finer control, create subclasses for '.svg-icon' (containerClasses prop) or '.svg-icon svg'
 * (or .svg-icon-content) (svgClasses prop).
 * Examples can be found in the svgIcon.scss file.
 *
 * Default look is inline-icon. Because they are often required, looks for containerClass="color-white" and
 * containerClass="color-primary" are pre-defined.
 */

import React, {Component, PropTypes} from "react";
import * as f from "lodash/fp";
import ReactDOM from "react-dom";
import request from "superagent";

const iconUrls = {
  devMonkey: "http://localhost:8081/monkey.svg",
  star: "http://localhost:8081/star.svg",
  lock: "http://localhost:8081/lock.svg"
};

class ImageCache {
  static _cache = {};

  static isCached(id) {
    return !f.isNil(f.prop(id, ImageCache._cache));
  }

  static cache(url, resolve, reject) {
    request
      .get(url)
      .end(
        (error, response) => {
          if (error) {
            reject(error);
          } else {
            ImageCache._cache[url] = response.text;
            resolve(response.text);
          }
        }
      )
  }

  static getOrFetch(identifier) {
    const url = f.prop(identifier, iconUrls) || identifier;
    return new Promise(
      (resolve, reject) => {
        if (ImageCache.isCached(url)) {
          resolve(ImageCache._cache[url]);
        } else {
          ImageCache.cache(url, resolve, reject);
        }
      }
    )
  }
}

class SvgIcon extends Component {
  static propTypes = {
    icon: PropTypes.string.isRequired,
    containerClasses: PropTypes.string,
    svgClasses: PropTypes.string,
    fillColor: PropTypes.string,
    center: PropTypes.bool,
    data: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = {loading: true};
    ImageCache
      .getOrFetch(props.icon)
      .then(svg => {
        this.containerElement.innerHTML = svg;
        this.svgData = this.containerElement.children["0"];
        this.setState({loading: false}, this.processImage);
      })
  }

  processImage = () => {
    const {fillColor, center, svgClasses} = this.props;
    this.svgData.classList.add("svg-icon-content");
    if (fillColor) {
      this.svgData.setAttribute("fill", fillColor);
    }
    if (center) {
      this.svgData.setAttribute("preserveAspectRatio", "xMidYMid meet");
    }
    if (svgClasses) {
      " ".split(svgClasses).forEach(c => this.svgData.classList.add(c))
    }
  };

  clickHandler = e => {
    const imgDOM = ReactDOM.findDOMNode(this.img);
  };

  componentDidMount() {
    this.clickHandler();
  }

  render() {
    return <div className={"svg-icon " + (this.props.containerClasses || "")}
                ref={el => { this.containerElement = el }}
    />
  }
}

export default SvgIcon;
