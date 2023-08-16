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

const isViewableUrl = url => {
  const fileType = f.last(url.split(".")).toLowerCase();
  return ["png", "jpg", "gif", "html", "pdf", "webp"].includes(fileType);
};

const EditLinkButton = ({ onClick, className }) => {
  const cssClass = buildClassName(className, { disabled: !onClick });
  return (
    <button onClick={onClick} className={cssClass} draggable={false}>
      <SvgIcon icon="edit" containerClasses="color-primary" />
    </button>
  );
};

const OpenAttachmentButton = ({ url, className }) => {
  const shouldOpenWindow = f.isString(url) && isViewableUrl(url);
  const handleOpenNewWindow = evt => {
    evt.preventDefault();
    if (shouldOpenWindow) window.open(url);
  };
  const cssClass = buildClassName(className, { disabled: !shouldOpenWindow });
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
    viewUrl
  } = props;
  const isAttachment = props.isAttachment || Boolean(viewUrl);
  const mainButtonClass = classNames("left", {
    linked: props.isLinked,
    "has-focus": props.selectedMode === 0
  });
  const linkButtonClass = classNames("linkButton", {
    "has-focus": props.selectedMode === 1
  });
  const handleClickEdit = () =>
    !isAttachment && canUserSeeTable(toTable)
      ? loadAndOpenEntityView({
          tableId: toTable,
          rowId: props.row.id,
          langtag: props.langtag
        })
      : undefined;
  return (
    <div
      style={props.style}
      key={props.row.id}
      ref={props.refIfLinked}
      tabIndex={props.isLinked ? 1 : -1}
    >
      <div className={getCssClass(props)}>
        {showToggleButton && (
          <a
            href="#"
            className={
              linkButtonClass +
              " roundCorners" +
              (userCanEdit ? "" : " linkButton--disabled")
            }
            draggable={false}
            onClick={evt => props.clickHandler(props.isLinked, props.row, evt)}
          >
            {props.isLinked ? (
              <SvgIcon icon="minus" containerClasses="color-primary" />
            ) : (
              <SvgIcon icon="plus" containerClasses="color-primary" />
            )}
          </a>
        )}
        {isAttachment ? (
          <OpenAttachmentButton className={linkButtonClass} url={viewUrl} />
        ) : (
          <EditLinkButton
            className={linkButtonClass}
            onClick={handleClickEdit}
          />
        )}
        <div className={mainButtonClass}>
          <div draggable={false}>
            {unless(
              f.isString,
              retrieveTranslation(props.langtag),
              props.label
            ) || <Empty langtag={props.langtag} />}
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
  viewUrl: PropTypes.string
};

export default LinkItem;
