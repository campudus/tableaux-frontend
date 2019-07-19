import React from "react";

import PropTypes from "prop-types";

const FilterPresetListItem = ({ template, deleteTemplate, applyTemplate }) => {
  const handleDeleteTemplate = React.useCallback(() =>
    !template.isSystemTemplate ? deleteTemplate(template) : () => null
  );
  const handleApplyTemplate = React.useCallback(() => {
    applyTemplate(template);
  });

  return (
    <div className="filter-preset-list__item">
      <div className="filter-preset-item__title">{template.title}</div>
      <div
        className="filter-preset-item__button filter-preset-item__button-apply"
        onClick={handleApplyTemplate}
      >
        <i className="fa fa-check" />
      </div>
      {!template.isSystemTemplate && (
        <div
          className="filter-preset-item__button filter-preset-item__button-delete"
          onClick={handleDeleteTemplate}
        >
          <i className="fa fa-cross" />
        </div>
      )}
    </div>
  );
};

export default FilterPresetListItem;

FilterPresetListItem.propTypes = {
  template: PropTypes.object.isRequired,
  deleteTemplate: PropTypes.func,
  applyTemplate: PropTypes.func.isRequired
};
