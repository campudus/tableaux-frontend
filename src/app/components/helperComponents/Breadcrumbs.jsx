import React from "react";
import { NavLink } from "react-router-dom";

export default function Breadcrumbs({ links = [] }) {
  return (
    <div className="breadcrumbs">
      {links.map((link, index) => (
        <>
          {index !== 0 && <i className="fa fa-angle-right breadcrumbs__icon" />}
          <NavLink
            key={link.path}
            to={link.path}
            className="breadcrumbs__link"
            exact
          >
            {link.label}
          </NavLink>
        </>
      ))}
    </div>
  );
}
