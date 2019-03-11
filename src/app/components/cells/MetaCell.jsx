import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { getLanguageOrCountryIcon } from "../../helpers/multiLanguage";
import { initiateDeleteRow } from "../../helpers/rowHelper";
import {
  hasUserAccessToLanguage,
  isUserAdmin
} from "../../helpers/accessManagementHelper";
import { DefaultLangtag } from "../../constants/TableauxConstants";
import classNames from "classnames";
import { isLocked } from "../../helpers/annotationHelper";

class MetaCell extends PureComponent {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    row: PropTypes.object.isRequired,
    expanded: PropTypes.bool.isRequired,
    selected: PropTypes.bool.isRequired
  };

  constructor(props) {
    super(props);
  }

  handleClick = event => {
    event.stopPropagation();
    const { toggleExpandedRow } = this.props;
    toggleExpandedRow();
  };

  mkDeleteRowButton() {
    const { langtag, selected, row, expanded, table } = this.props;
    const userCanDeleteRow =
      table.type !== "settings" &&
      selected &&
      isUserAdmin() &&
      (langtag === DefaultLangtag || !expanded);

    return userCanDeleteRow && !row.final && selected ? (
      <div className="delete-row">
        <button
          className="button"
          onClick={() => initiateDeleteRow({ table, row, langtag })}
        >
          <i className="fa fa-trash" />
        </button>
      </div>
    ) : null;
  }

  mkLockStatusIcon = () => {
    const { langtag, row, selected, expanded } = this.props;
    const cantTranslate =
      !isUserAdmin() &&
      (selected || expanded) &&
      !hasUserAccessToLanguage(langtag);
    if (cantTranslate) {
      return <i className="fa fa-ban access-denied-icon" />;
    } else if (row.final) {
      return (
        <i
          className={
            isLocked(row)
              ? "fa fa-lock access-denied-icon"
              : "fa fa-unlock access-denied-icon"
          }
        />
      );
    }
    return null;
  };

  render = () => {
    const { langtag, row, expanded, selected } = this.props;
    const cellContent = expanded ? (
      getLanguageOrCountryIcon(langtag)
    ) : (
      <div className="meta-info-collapsed">
        <div className="row-number">{row.id}</div>
        <div className="row-expand">
          <i className="fa fa-chevron-down" />
        </div>
      </div>
    );

    const cellClass = classNames("meta-cell", {
      "row-expanded": expanded,
      "in-selected-row": selected
    });

    return (
      <div className={cellClass} onClick={this.handleClick}>
        <div className="cell-content">
          {this.mkDeleteRowButton()}
          {this.mkLockStatusIcon()}
          {cellContent}
        </div>
      </div>
    );
  };
}

export default MetaCell;
