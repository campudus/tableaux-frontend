/*
 * Consistent display of link lists for EntityView, DependentRows, etc
 * Props: table: {name: string, linkTarget: url-string}
 *        links: [{displayName, linkTarget: url-string},...]
 */

import React, {Component, PropTypes} from "react";
import classNames from "classnames";
import i18n from "i18next";
import {take} from "lodash/fp";

const MAX_DISPLAYED_LINKS = 4;

class LinkList extends Component {
  static propTypes = {
    links: PropTypes.array.isRequired,
    setLink: PropTypes.func,
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

  renderLinks = (links, max) => ((max) ? take(max, links) : links).map(
    ({displayName, linkTarget = "#"}, idx) => {
      return (
        <div className="link-label-wrapper" key={idx}>
          <a className="link-label" href={linkTarget} target="_blank">
            {displayName}
            <i className="fa fa-long-arrow-right" />
          </a>
        </div>
      )
    }
  );

  setHovering = idx => isHovering => () => {
    this.setState({hovered: (isHovering) ? idx : null});
  };

  renderInteractiveLinks = (links, max) => {
    const {setLink, unlink} = this.props;
    return ((max) ? take(max, links) : links).map(
      ({displayName, linkTarget, linked}, idx) => {
        const mainFn = (linked) ? unlink(idx) : setLink(idx);
        const iconClass = classNames("main-button-icon",
          {
            "fa fa-check": !linked,
            "fa fa-times": linked
          }
        );
        const cssClass = classNames("link-label-wrapper with-buttons", {
          "show-buttons": this.state.hovered === idx
        });

        return (
          <div className={cssClass} key={idx}
               onMouseEnter={this.setHovering(idx)(true)}
               onMouseLeave={this.setHovering(idx)(false)}
          >
            <a className="link-label" href="#" onClick={mainFn} >
              {displayName}<i className={iconClass} />
            </a>
            <a className="secondary-button-icon" href={linkTarget} target="_blank">
              <i className="fa fa-long-arrow-right" />
            </a>
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
    const {setLink, unlink} = this.props;

    return (
      <div className="link-list">
        <div className={cssClass}>
          {(setLink && unlink)
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