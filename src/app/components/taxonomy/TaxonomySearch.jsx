import i18n from "i18next";
import * as f from "lodash/fp";
import React, { useCallback, useMemo, useState } from "react";
import { FilterModes } from "../../constants/TableauxConstants";
import { buildClassName } from "../../helpers/buildClassName";
import { intersperse } from "../../helpers/functools";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import { createTextFilter } from "../../helpers/searchFunctions";
import * as t from "./taxonomy";

const ResultItem = ({ langtag, node, onSelect }) => {
  const Separator = (
    <span className="taxonomy-search__result-item__path-separator">&gt;</span>
  );
  const path = intersperse(
    Separator,
    node.path.map(n => {
      const title = retrieveTranslation(langtag, n.displayValue);
      return (
        <span
          key={n.id}
          className="taxonomy-search__result-item__path-step"
          title={title}
        >
          {title}
        </span>
      );
    })
  );

  const className = buildClassName("taxonomy-search__result-item", {
    leaf: t.isLeaf(node)
  });

  return (
    <li className={className} onClick={() => onSelect(node)}>
      <div className="taxonomy-search__result-item__path">{path}</div>
      <div className="taxonomy-search__result-item__content">
        {retrieveTranslation(langtag, node.displayValue)}
      </div>
    </li>
  );
};

const TaxonomySearch = ({
  nodes, // List TreeNode
  onSelect, // TreeNode -> ()
  langtag
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchMode = FilterModes.CONTAINS;
  const searchFn = useCallback(createTextFilter(searchMode, searchTerm), [
    searchTerm
  ]);
  const results = useMemo(() => t.findTreeNodes(langtag)(searchFn)(nodes), [
    nodes,
    searchFn
  ]);

  const handleFocusInput = useCallback(() => {
    setShowResults(true);
  }, []);
  const handleBlurInput = () => {
    setShowResults(false);
  };
  const handleKeyPress = useCallback(event => {
    const key = event.key;

    if (key === "Escape" && !f.isEmpty(searchTerm)) {
      event.stopPropagation();
      setSearchTerm("");
    }
  });
  const handleInput = useCallback(event => {
    setSearchTerm(event.target.value);
  }, []);

  return (
    <div className="taxonomy-search">
      <div className="taxonomy-search__wrapper">
        <input
          onFocus={handleFocusInput}
          onBlur={handleBlurInput}
          className="taxonomy-search__input"
          type="text"
          value={searchTerm}
          placeholder={i18n.t("table:taxonomy.search-placeholder")}
          onChange={handleInput}
          onKeyDown={handleKeyPress}
        />
        <i className="fa fa-search" />
      </div>
      {showResults ? (
        <div className="taxonomy-search__results">
          <ul className="taxonomy-search__results-list">
            {results.map(node => (
              <ResultItem
                key={node.id}
                langtag={langtag}
                onSelect={onSelect}
                node={node}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default TaxonomySearch;
