import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import SvgIcon from "../../helperComponents/SvgIcon";
import { loadAndOpenEntityView } from "../../overlay/EntityViewOverlay";
import Empty from "../../helperComponents/emptyEntry";
import { unless } from "../../../helpers/functools";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import f from "lodash/fp";
import { canUserSeeTable } from "../../../helpers/accessManagementHelper.js";
import { Link } from "react-router-dom";
import { buildClassName } from "../../../helpers/buildClassName";
import PermissionDenied from "../../helperComponents/PermissionDenied";

const isViewableUrl = url => {
  const fileType = f.last(url.split(".")).toLowerCase();
  return ["png", "jpg", "jpeg", "gif", "html", "pdf", "webp", "svg"].includes(
    fileType
  );
};

const LinkButton = ({ className, onClick, disabled = !onClick, children }) => {
  const cssClass = buildClassName("linkButton", { disabled }, className);
  return (
    <button
      className={cssClass}
      onClick={onClick}
      draggable={false}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const OpenAttachmentButton = ({ url, className }) => {
  const shouldOpenWindow = f.isString(url) && isViewableUrl(url);
  const disabled = !shouldOpenWindow;
  const handleOpenNewWindow = evt => {
    evt.preventDefault();
    if (shouldOpenWindow) window.open(url);
  };
  const cssClass = buildClassName("linkButton", { disabled }, className);
  return (
    <Link className={cssClass} to={url} onClick={handleOpenNewWindow}>
      <i className="fa fa-eye" />
    </Link>
  );
};

const getCssClass = ({ isLinked, isSelected }) =>
  classNames("list-item", {
    isLinked: isLinked,
    selected: isSelected
  });

const LinkItem = props => {
  const {
    showToggleButton = true,
    toTable,
    userCanEdit = true,
    viewUrl,
    isPermissionDenied = false,
    archived = false
  } = props;
  const isAttachment = props.isAttachment || Boolean(viewUrl);
  const isDisabled = isPermissionDenied || !userCanEdit;

  const mainButtonClass = classNames("left", {
    linked: props.isLinked,
    "has-focus": props.selectedMode === 0,
    archived
  });
  const secondaryButtonClass = classNames("link-item-button", {
    "has-focus": props.selectedMode === 1,
    archived
  });

  const handleClickEdit = () =>
    !isAttachment && canUserSeeTable(toTable)
      ? loadAndOpenEntityView({
          tableId: toTable,
          rowId: props.row.id,
          langtag: props.langtag
        })
      : undefined;

  const handleClickToggle = evt =>
    props.clickHandler(props.isLinked, props.row, evt);

  const linkName = unless(
    f.isString,
    retrieveTranslation(props.langtag),
    props.label
  );

  return (
    <div
      style={props.style}
      key={props.row.id}
      ref={props.refIfLinked}
      tabIndex={props.isLinked ? 1 : -1}
    >
      <div className={getCssClass(props)}>
        {showToggleButton && (
          <LinkButton
            className={secondaryButtonClass}
            onClick={handleClickToggle}
            disabled={isDisabled}
          >
            {props.isLinked ? (
              <SvgIcon icon="minus" containerClasses="color-primary" />
            ) : (
              <SvgIcon icon="plus" containerClasses="color-primary" />
            )}
          </LinkButton>
        )}
        {isAttachment ? (
          <OpenAttachmentButton
            className={secondaryButtonClass}
            url={viewUrl}
          />
        ) : (
          <LinkButton
            className={secondaryButtonClass}
            onClick={handleClickEdit}
            disabled={isDisabled}
          >
            {archived ? (
              <i className="fa fa-eye" />
            ) : (
              <SvgIcon icon="edit" containerClasses="color-primary" />
            )}
          </LinkButton>
        )}
        <div className={mainButtonClass}>
          <div draggable={false}>
            {isPermissionDenied ? (
              <PermissionDenied />
            ) : f.isEmpty(linkName) ? (
              <Empty />
            ) : (
              <span title={linkName}>{linkName}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

LinkItem.propTypes = {
  refIfLinked: PropTypes.func,
  clickHandler: PropTypes.func,
  isLinked: PropTypes.bool,
  isSelected: PropTypes.bool,
  row: PropTypes.object.isRequired,
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  style: PropTypes.object,
  toTable: PropTypes.number.isRequired,
  showToggleButton: PropTypes.bool,
  userCanEdit: PropTypes.bool,
  viewUrl: PropTypes.string,
  isPermissionDenied: PropTypes.bool
};

export default LinkItem;
