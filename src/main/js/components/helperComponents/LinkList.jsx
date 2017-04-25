/*
 * Consistent display of link lists for EntityView, DependentRows, etc
 * Props: table: {name: string, linkTarget: url-string}
 *        links: [{displayName, linkTarget: url-string},...]
 */

import React, {Component, PropTypes} from "react";
import classNames from "classnames";
import i18n from "i18next";
import {isEmpty, isString, take} from "lodash/fp";
import {loadAndOpenEntityView} from "../overlay/EntityViewOverlay";

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
    if (isEmpty(linkTarget)) {
      return;
    }
    evt.stopPropagation();
    if (isString(linkTarget)) {
      window.open(linkTarget, "_blank");
    } else {
      loadAndOpenEntityView(linkTarget, this.props.langtag)
    }
  };

  renderLinks = (links, max) => ((max) ? take(max, links) : links).map(
    ({displayName, linkTarget}, idx) => {
      return (
        <div className="link-label-wrapper" key={idx} onClick={this.proceedTo(linkTarget)} >
          <a className="link-label" href="#">
            {displayName}
            {(isEmpty(linkTarget)) ? null : <i className="fa fa-long-arrow-right" />}
          </a>
        </div>
      )
    }
  );

  renderInteractiveLinks = (links, max) => {
    const {unlink} = this.props;
    return ((max) ? take(max, links) : links).map(
      ({displayName, linkTarget}, idx) => {
        const hovered = this.state.hovered === idx;
        const cssClass = classNames("link-label-wrapper has-buttons", {
          "show-buttons": hovered
        });
        const setHoverState = () => {
          if (this.state.expanded || idx < MAX_DISPLAYED_LINKS) {
            this.setState({hovered: idx});
          }
        };

        return (
          <div key={idx} className={cssClass}
               onMouseEnter={setHoverState}
               onMouseLeave={() => {
                 if (hovered) {
                   this.setState({hovered: null})
                 }
               }}
          >
            <div className="main-button" onClick={this.proceedTo(linkTarget)} >
              <a href="#">
                <div className="text-wrapper">{displayName}</div>
              </a>
              {(hovered) ? <i className="fa fa-long-arrow-right" /> : null}
            </div>
            {(hovered)
              ? (<div className="unlink-button" onClick={unlink(idx)}>
                  <a href="#" >
                    <i className="fa fa-times" />
                  </a>
                </div>
              )
              : null }
          </div>
        )
      }
    );
  };

  render() {
    const {links} = this.props;
    const nLinks = links.length;
    const {expanded} = this.state;
    const canExpand = nLinks > MAX_DISPLAYED_LINKS;
    const cssClass = classNames("item-content", {
      "can-expand": canExpand & !expanded,
      "expanded": expanded
    });
    const {unlink} = this.props;

    return (
      <div className="link-list">
        <div className={cssClass}>
          {(unlink)
            ? this.renderInteractiveLinks(links, (!expanded) ? MAX_DISPLAYED_LINKS : null)
            : this.renderLinks(links, (!expanded) ? MAX_DISPLAYED_LINKS : null)
          }
        </div>
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
    )
  }
}

export default LinkList;