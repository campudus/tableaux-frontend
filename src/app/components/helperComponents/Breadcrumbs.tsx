import React, { Fragment, MouseEvent, ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { buildClassName as cn } from "../../helpers/buildClassName";

export type BreadcrumbsProps = {
  className?: string;
  // Allow either path or onClick, but not both
  links: (
    | { label: ReactNode; path: string; onClick?: never }
    | {
        label: ReactNode;
        path?: never;
        onClick: (event: MouseEvent<HTMLButtonElement>) => void;
      }
  )[];
};

export default function Breadcrumbs({
  className,
  links = []
}: BreadcrumbsProps) {
  return (
    <div className={cn("breadcrumbs", {}, className)}>
      {links.map((link, index) => {
        const isFirst = index === 0;
        const isActive = index === links.length - 1;

        return (
          <Fragment key={link.path ?? index}>
            {!isFirst && <i className="fa fa-angle-right breadcrumbs__icon" />}

            {link.path ? (
              <NavLink to={link.path} className="breadcrumbs__link" exact>
                {link.label}
              </NavLink>
            ) : (
              <button
                onClick={link.onClick}
                className={cn(
                  "breadcrumbs__link",
                  {},
                  isActive ? "active" : ""
                )}
              >
                {link.label}
              </button>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
