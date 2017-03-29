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
    table: PropTypes.object.isRequired,
    links: PropTypes.array.isRequired,
    editIcons: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.state = {expanded: false};
  }

  toggleExpand = () => this.setState({expanded: !this.state.expanded});

  renderLinks = (links, max) => ((max) ? take(max, links) : links).map(
    ({displayName, linkTarget, linked = false}, idx) => {
      const {editIcons} = this.props;
      const cssClass = classNames("link-label", {"with-edit-icons": editIcons});
      const linkIcon = (linked) ? "fa fa-times" : "fa fa-check";
      return (
        <div className="link-label-wrapper" key={idx}>
          <a className={cssClass} href={linkTarget} target="_blank">
            {displayName}
            <i className="fa fa-long-arrow-right" />
          </a>
          {
            (editIcons)
              ? <a className="edit-icon" href="#"><i className={linkIcon} /></a>
              : null
          }
        </div>
      )
    }
  );

  render() {
    const {table, links} = this.props;
    const nLinks = links.length;
    const {expanded} = this.state;
    const canExpand = nLinks > MAX_DISPLAYED_LINKS;
    const cssClass = classNames("item-content", {
      "can-expand": canExpand & !expanded,
      "expanded": expanded
    });

    return (
      <div className="item link-list">
        <a className="item-header link" href={table.linkTarget} target="_blank">
          {table.name}
          <i className="fa fa-external-link" />
        </a>
        <div className={cssClass}>
          {this.renderLinks(links, (!expanded) ? MAX_DISPLAYED_LINKS : null)}
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