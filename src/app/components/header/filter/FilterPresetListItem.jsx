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
    <div className="filter-preset-list__item" onClick={handleApplyTemplate}>
      <div className="filter-preset-item__title">{template.title}</div>
      {!template.isSystemTemplate && (
        <button
          className="filter-preset-item__button filter-preset-item__button-delete"
          onClick={handleDeleteTemplate}
        >
          <i className="fa fa-trash" />
        </button>
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
