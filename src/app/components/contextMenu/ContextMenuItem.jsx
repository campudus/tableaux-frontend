import React from "react";
import f from "lodash/fp";
import PropTypes from "prop-types";

import classNames from "classnames";

const RowContextMenuItem = ({
  itemAction,
  label,
  icon,
  iconClass = "",
  enabled = false,
  closeMenu,
  hide,
  t
}) => {
  const cssClass = classNames("context-menu__item", {
    "context-menu__item--disabled": !enabled
  });

  const iconCssClass = `context-menu-item__icon fa fa-${icon} ${iconClass}`;

  const handleClick = React.useCallback(() => {
    closeMenu();
    itemAction();
  });

  return (
    !hide && (
      <div className={cssClass} onClick={handleClick}>
        <i className={iconCssClass}></i>
        <div className="context-menu-item__label">
          {f.isArray(label) ? t(...label) : t(label)}
        </div>
      </div>
    )
  );
};

export default RowContextMenuItem;

RowContextMenuItem.propTypes = {
  enabled: PropTypes.bool,
  hide: PropTypes.bool,
  itemAction: PropTypes.func.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired,
  icon: PropTypes.string,
  iconClass: PropTypes.string,
  t: PropTypes.func.isRequired,
  closeMenu: PropTypes.func.isRequired
};
