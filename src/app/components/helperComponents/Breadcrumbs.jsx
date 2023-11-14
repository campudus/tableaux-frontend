import React, { Fragment } from "react";
import { NavLink } from "react-router-dom";

export default function Breadcrumbs({ links = [] }) {
  return (
    <div className="breadcrumbs">
      {links.map((link, index) => (
        <Fragment key={link.path}>
          {index !== 0 && <i className="fa fa-angle-right breadcrumbs__icon" />}
          <NavLink to={link.path} className="breadcrumbs__link" exact>
            {link.label}
          </NavLink>
        </Fragment>
      ))}
    </div>
  );
}
