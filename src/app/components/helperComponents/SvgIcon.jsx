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

import React, { Component } from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { makeRequest } from "../../helpers/apiHelper";

const iconUrls = {
  addSubItem: "/img/icons/add-sub-item.svg",
  arrow: "/img/icons/arrow-long.svg",
  burger: "/img/icons/burger-thin.svg",
  check: "/img/icons/check.svg",
  cross: "/img/icons/cross.svg",
  tablelink: "/img/icons/goto-table.svg",
  plus: "/img/icons/plus.svg",
  minus: "/img/icons/minus.svg",
  highlight: "/img/icons/highlight.svg",
  edit: "/img/icons/edit.svg",
  addTranslation: "/img/icons/translation-add.svg",
  compareTranslation: "/img/icons/translation-compare.svg",
  vdots: "/img/icons/vertical-dots.svg",
  deletedFile: "/img/icons/icon-deleted-file.svg",
  layoutV: "/img/icons/layout-vertical.svg",
  layoutH: "/img/icons/layout-horizontal.svg",
  layoutPlain: "/img/icons/layout-single.svg",
  trash: "/img/icons/trash.svg"
};

class ImageCache {
  static _cache = {};
  static _subscribers = {};

  static getCached(id) {
    return f.prop(id, ImageCache._cache);
  }

  static cache(url, resolve, reject) {
    const subscribers = f.prop(["_subscribers", url], ImageCache) || [];
    ImageCache._subscribers[url] = [
      ...subscribers,
      {
        error: reject,
        success: resolve
      }
    ];

    if (f.isEmpty(subscribers)) {
      // We're referring to the subscribers value BEFORE we added the current one
      makeRequest({ url, responseType: "text" })
        .then(responseText => {
          // subscribers might have changed since fetch was initialised
          const subscribersNow = f.prop(["_subscribers", url], ImageCache);
          ImageCache._cache[url] = responseText;
          subscribersNow.forEach(subscriber =>
            subscriber.success(responseText)
          );
        })
        .catch(error => {
          const subscribersNow = f.prop(["_subscribers", url], ImageCache);
          subscribersNow.forEach(subscriber => subscriber.error(error));
        });
    }
  }

  static getOrFetch(identifier) {
    const url = f.prop(identifier, iconUrls) || identifier;
    return new Promise((resolve, reject) => {
      const cachedImg = ImageCache.getCached(url);
      if (cachedImg) {
        resolve(cachedImg);
      } else {
        ImageCache.cache(url, resolve, reject);
      }
    });
  }
}

class SvgIcon extends Component {
  static propTypes = {
    icon: PropTypes.string.isRequired, // url or key for iconUrls map
    containerClasses: PropTypes.string, // classes added to the container element
    svgClasses: PropTypes.string, // classes added to the svg element
    fillColor: PropTypes.string, // html-string, fill property of top svg element
    center: PropTypes.bool, // apply "preserveAspectRadio: xMidyMid meet" to svg?
    title: PropTypes.string // svg title, displayed on hover by e.g. firefox (default: empty)
  };

  constructor(props) {
    super(props);
    this.state = { loading: true };
    this.setSvg(props.icon);
  }

  setSvg = fileName => {
    ImageCache.getOrFetch(fileName).then(svg => {
      if (!this.containerElement) {
        // Icon unmounted before svg was loaded
        return;
      }
      this.containerElement.innerHTML = svg;
      this.svgData = this.containerElement.children["0"];
      this.setState(
        { loading: false },
        () => this.svgData && this.processImage()
      );
    });
  };

  componentWillReceiveProps = newProps => {
    if (newProps.icon !== this.props.icon) {
      this.setSvg(newProps.icon);
    }
  };

  processImage = () => {
    const addClass = (element, className) => {
      try {
        element.classList.add(className);
      } catch (e) {
        const classNames = ` ${(
          (element && element.classNames) ||
          ""
        ).toString()} ${className}`;
        element && element.setAttribute("class", classNames.toString());
      }
    };
    const { fillColor, center, svgClasses, title } = this.props;
    addClass(this.svgData, "svg-icon-content");
    f.forEach(t => {
      t.innerHTML = f.defaultTo("", title);
    }, this.svgData.getElementsByTagName("title"));
    if (fillColor) {
      this.svgData.setAttribute("fill", fillColor);
    }
    if (center) {
      this.svgData.setAttribute("preserveAspectRatio", "xMidYMid meet");
    }
    if (svgClasses) {
      " ".split(svgClasses).forEach(c => addClass(this.svgData, c));
    }
  };

  render() {
    return (
      <div
        className={"svg-icon " + (this.props.containerClasses || "")}
        ref={el => {
          this.containerElement = el;
        }}
      />
    );
  }
}

export default SvgIcon;
