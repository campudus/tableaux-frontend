import React, { Fragment, ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { buildClassName as cn } from "../../helpers/buildClassName";

export type BreadcrumbsProps = {
  className?: string;
  links: { path: string; label: ReactNode }[];
};

export default function Breadcrumbs({
  className,
  links = []
}: BreadcrumbsProps) {
  return (
    <div className={cn("breadcrumbs", {}, className)}>
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
