import React, { Fragment, MouseEvent, ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { buildClassName as cn } from "../../helpers/buildClassName";
import ButtonAction from "./ButtonAction";

type BreadcrumbsLink = {
  label: ReactNode;
  isActive?: boolean;
  testId: string;
} & (
  | { path: string; onClick?: never }
  | {
      path?: never;
      onClick: (event: MouseEvent<HTMLButtonElement>) => void;
    }
);

function BreadcrumbsLink({
  path,
  label,
  onClick,
  isActive,
  testId
}: BreadcrumbsLink) {
  return path ? (
    <NavLink
      to={path}
      className={cn("breadcrumbs__link", {}, isActive ? "active" : "")}
      end
      data-testid={testId}
    >
      {label}
    </NavLink>
  ) : (
    <button
      onClick={onClick}
      className={cn("breadcrumbs__link", {}, isActive ? "active" : "")}
      data-testid={testId}
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
  const navigate = useNavigate();
  const needsDropdown = links.length > 3;

  if (needsDropdown) {
    const firstLink = links.at(0);
    const menuLinks = links.slice(1, -1);
    const lastLink = links.at(-1);

    return (
      <div className={cn("breadcrumbs", {}, className)}>
        <BreadcrumbsLink {...firstLink!} />
        <i className="fa fa-angle-right breadcrumbs__icon" />
        <ButtonAction
          variant="text"
          label={"..."}
          testId="breadcrumbs-more"
          options={menuLinks.map(link => {
            return {
              label: link.label,
              onClick: link.onClick ?? (() => navigate(link.path)),
              testId: link.testId
            };
          })}
        />
        <i className="fa fa-angle-right breadcrumbs__icon" />
        <BreadcrumbsLink {...lastLink!} isActive />
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

            <BreadcrumbsLink {...link} isActive={isActive} />
          </Fragment>
        );
      })}
    </div>
  );
}
