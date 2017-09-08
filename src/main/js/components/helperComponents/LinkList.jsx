/*
 * Consistent display of link lists for EntityView, DependentRows, etc
 * Props: table: {name: string, linkTarget: url-string}
 *        links: [{displayName, linkTarget: url-string},...]
 */

import React, {Component} from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import i18n from "i18next";
import * as f from "lodash/fp";
import {loadAndOpenEntityView} from "../overlay/EntityViewOverlay";
import {List} from "react-virtualized";
import SvgIcon from "../helperComponents/SvgIcon";

const MAX_DISPLAYED_LINKS = 4;

class LinkList extends Component {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    links: PropTypes.array.isRequired,
    unlink: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
      hovered: null
    };
  }

  toggleExpand = () => this.setState({expanded: !this.state.expanded});

  proceedTo = linkTarget => evt => {
    if (f.isEmpty(linkTarget)) {
      return;
    }
    evt.stopPropagation();
    if (f.isString(linkTarget)) {
      window.open(linkTarget, "_blank");
    } else {
      loadAndOpenEntityView(linkTarget, this.props.langtag);
    }
  };

  renderLink = ({index, key = index, style}) => {
    const {displayName, linkTarget} = this.props.links[index];
    return (
      <div className="link-label-wrapper-2" key={key} style={style}>
        <div className="link-label-wrapper" onClick={this.proceedTo(linkTarget)}>
          <a className="link-label" href="#">
            {displayName}
            {(f.isEmpty(linkTarget)) ? null : <i className="fa fa-long-arrow-right" />}
          </a>
        </div>
      </div>
    );
  };

  renderInteractiveLink = ({index, key = index, style}) => {
    const {links, unlink} = this.props;
    const {displayName, linkTarget} = links[index];
    const hovered = this.state.hovered === index;
    const cssClass = classNames("link-label-wrapper has-buttons", {
      "show-buttons": hovered
    });
    const setHoverState = () => {
      this.setState({hovered: index});
    };

    return (
      <div className="link-label-wrapper-2" style={style} key={key}>
        <div className={cssClass}
             onMouseEnter={setHoverState}
             onMouseLeave={() => {
               if (hovered) {
                 this.setState({hovered: null});
               }
             }}
        >
          <div className="main-button" onClick={this.proceedTo(linkTarget)}>
            <a href="#">
              <div className="text-wrapper">{displayName}</div>
            </a>
            {(hovered) ? <i className="fa fa-long-arrow-right" /> : null}
          </div>
          {(hovered)
            ? (<div className="unlink-button" onClick={unlink(index)}>
                <a href="#">
                  <SvgIcon icon="cross" containerClasses="color-primary" />
                </a>
              </div>
            )
            : null }
        </div>
      </div>
    );
  };

  renderPreview = () => {
    const {links, unlink} = this.props;
    const nLinks = links.length;
    const canExpand = nLinks > MAX_DISPLAYED_LINKS;
    const renderFn = (unlink) ? this.renderInteractiveLink : this.renderLink;
    const cssClass = classNames("item-content", {"can-expand": canExpand});
    return (
      <div className={cssClass}>
        {f.range(0, f.min([nLinks, MAX_DISPLAYED_LINKS]))
          .map(index => renderFn({index}))
        }
      </div>
    );
  };

  renderAll = () => {
    const {links, unlink} = this.props;
    const nLinks = links.length;

    return (
      <List width={window.innerWidth * 0.6 - 100}
            height={430}
            rowCount={nLinks}
            rowHeight={42}
            rowRenderer={(unlink) ? this.renderInteractiveLink : this.renderLink}
            hovered={this.state.hovered}
      />
    );
  };

  render() {
    const {links} = this.props;
    const nLinks = links.length;
    const {expanded} = this.state;
    const canExpand = nLinks > MAX_DISPLAYED_LINKS;

    return (
      <div className="link-list">
        {(expanded)
          ? this.renderAll()
          : this.renderPreview()
        }
        {(canExpand)
          ? (<a className="expand-button" href="#" onClick={this.toggleExpand}>
              <i className={(expanded) ? "fa fa-angle-up" : "fa fa-angle-down"} />
              {(expanded)
                ? i18n.t("table:show_less")
                : i18n.t("table:show_all_items", {nItems: nLinks})
              }
            </a>
          )
          : null
        }
      </div>
    );
  }
}

export default LinkList;
