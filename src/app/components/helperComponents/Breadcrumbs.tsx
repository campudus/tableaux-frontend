import React, { Fragment, MouseEvent, ReactNode } from "react";
import { NavLink, useHistory } from "react-router-dom";
import { buildClassName as cn } from "../../helpers/buildClassName";
import ButtonAction from "./ButtonAction";

type BreadcrumbsLink = {
  label: ReactNode;
  isActive?: boolean;
} & (
  | { path: string; onClick?: never }
  | {
      path?: never;
      onClick: (event: MouseEvent<HTMLButtonElement>) => void;
    }
);

function BreadcrumsbLink({ path, label, onClick, isActive }: BreadcrumbsLink) {
  return path ? (
    <NavLink
      to={path}
      className={cn("breadcrumbs__link", {}, isActive ? "active" : "")}
      exact
    >
      {label}
    </NavLink>
  ) : (
    <button
      onClick={onClick}
      className={cn("breadcrumbs__link", {}, isActive ? "active" : "")}
    >
      {label}
    </button>
  );
}

export type BreadcrumbsProps = {
  className?: string;
  // Allow either path or onClick, but not both
  links: BreadcrumbsLink[];
};

export default function Breadcrumbs({
  className,
  links = []
}: BreadcrumbsProps) {
  const history = useHistory();
  const needsDropdown = links.length > 3;

  const navigate = (path: string) => {
    history.push(path);
  };

  if (needsDropdown) {
    const firstLink = links.at(0);
    const menuLinks = links.slice(1, -1);
    const lastLink = links.at(-1);

    return (
      <div className={cn("breadcrumbs", {}, className)}>
        <BreadcrumsbLink {...firstLink!} />
        <i className="fa fa-angle-right breadcrumbs__icon" />
        <ButtonAction
          variant="text"
          label={"..."}
          options={menuLinks.map(link => {
            return {
              label: link.label,
              onClick: link.onClick ?? (() => navigate(link.path))
            };
          })}
        />
        <i className="fa fa-angle-right breadcrumbs__icon" />
        <BreadcrumsbLink {...lastLink!} isActive />
      </div>
    );
  }

  return (
    <div className={cn("breadcrumbs", {}, className)}>
      {links.map((link, index) => {
        const isFirst = index === 0;
        const isActive = index === links.length - 1;

        return (
          <Fragment key={link.path ?? index}>
            {!isFirst && <i className="fa fa-angle-right breadcrumbs__icon" />}

            <BreadcrumsbLink {...link} isActive={isActive} />
          </Fragment>
        );
      })}
    </div>
  );
}
