import React from "react";
import classNames from "classnames";

import PropTypes from "prop-types";

import { preventDefault } from "../../helpers/functools";

export const StyleIcon = ({
  toggleStyle,
  styleToToggle,
  label,
  icon,
  active
}) => {
  const handleClick = React.useCallback(event => {
    preventDefault(event);
    toggleStyle(styleToToggle);
  });
  const cssClass = classNames("richtext-toggle-style-button", {
    "style-button--active": active
  });
  return (
    <div className={cssClass} onClick={handleClick}>
      {label ? (
        <span style={{ fontWeight: "bold" }}>{label}</span>
      ) : icon ? (
        <i className={"fa " + icon} />
      ) : (
        styleToToggle
      )}
    </div>
  );
};
StyleIcon.propTypes = {
  toggleStyle: PropTypes.func.isRequired,
  styleToToggle: PropTypes.string.isRequired,
  active: PropTypes.bool,
  icon: PropTypes.string,
  label: PropTypes.string
};

const StyleControls = ({
  editorState,
  toggleBlockType,
  toggleInlineStyle,
  additionalButtons
}) => {
  const blockTypes = [
    { type: "header-one", label: "H1" },
    { type: "header-two", label: "H2" },
    { type: "header-three", label: "H3" },
    // draftjs supports at least six header depths, how many do we want?
    // { type: "header-four", label: "H4" },
    // { type: "header-four", label: "H5" },
    // { type: "header-four", label: "H6" },
    { type: "blockquote", icon: "fa-quote-right" },
    { type: "unordered-list-item", icon: "fa-list-ul" },
    { type: "ordered-list-item", icon: "fa-list-ol" }
  ];
  const inlineStyles = [
    { type: "BOLD", icon: "fa-bold" },
    { type: "ITALIC", icon: "fa-italic" }
    // There is no standard markdown for underline
    // { type: "UNDERLINE", icon: "fa-underline" }
  ];
  const inlineStyle = editorState.getCurrentInlineStyle();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(editorState.getSelection().getStartKey())
    .getType();

  return (
    <div className="richtext-toggle-style__bar">
      {blockTypes.map(style => (
        <StyleIcon
          key={style.type}
          toggleStyle={toggleBlockType}
          styleToToggle={style.type}
          active={blockType === style.type}
          icon={style.icon}
          label={style.label}
        />
      ))}
      {inlineStyles.map(style => (
        <StyleIcon
          key={style.type}
          toggleStyle={toggleInlineStyle}
          styleToToggle={style.type}
          active={inlineStyle.has(style.type)}
          icon={style.icon}
          label={style.label}
        />
      ))}
      {additionalButtons && (
        <>
          <div className="richtext-toggle-style__placeholder" />
          {additionalButtons}
        </>
      )}
    </div>
  );
};

export default StyleControls;

StyleControls.propTypes = {
  toggleBlockType: PropTypes.func.isRequired,
  toggleInlineStyle: PropTypes.func.isRequired,
  editorState: PropTypes.object.isRequired,
  additionalButtons: PropTypes.array
};
