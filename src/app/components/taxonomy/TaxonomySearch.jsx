import i18n from "i18next";
import * as f from "lodash/fp";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { FilterModes } from "../../constants/TableauxConstants";
import { buildClassName } from "../../helpers/buildClassName";
import { intersperse } from "../../helpers/functools";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import { createTextFilter } from "../../helpers/searchFunctions";
import { outsideClickEffect } from "../../helpers/useOutsideClick";
import * as t from "./taxonomy";

const EmptyResultsPlaceholder = () => {
  const classNames = buildClassName("taxonomy-search__result-item", {
    placeholder: true
  });

  return (
    <li className={classNames}>
      <span>{i18n.t("table:taxonomy.search-no-results")}</span>
    </li>
  );
};

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
      <div className="taxonomy-search__result-item__wrapper">
        <div className="taxonomy-search__result-item__path">{path}</div>
        <div className="taxonomy-search__result-item__content">
          <span className="taxonomy-search__result-item__title">
            {retrieveTranslation(langtag, node.displayValue)}
          </span>
        </div>
      </div>
    </li>
  );
};

const pathToStrings = langtag => node =>
  node.path.map(step => retrieveTranslation(langtag, step.displayValue));

const extractDisplayValue = langtag => node =>
  retrieveTranslation(langtag, node.displayValue);

const TaxonomySearch = ({
  nodes, // List TreeNode
  onSelect, // TreeNode -> ()
  langtag,
  classNames
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchMode = FilterModes.CONTAINS;
  const searchFn = useCallback(createTextFilter(searchMode, searchTerm), [
    searchTerm
  ]);
  const containerRef = useRef();
  useEffect(
    outsideClickEffect({
      shouldListen: showResults,
      containerRef,
      onOutsideClick: () => setShowResults(false)
    })
  );
  const results = useMemo(() => {
    // we need to do that, as nodes are not yet parsed as a tree
    const parents = nodes.reduce((accum, n) => {
      if (n.parent) accum.add(n.parent);
      return accum;
    }, new Set());
    return f.compose(
      f.orderBy([pathToStrings(langtag), extractDisplayValue(langtag)], "asc"),
      t.findTreeNodes(langtag)(searchFn),
      f.map(n => (parents.has(n.id) ? { ...n, children: [1] } : n))
    )(nodes);
  }, [nodes, searchFn]);

  const handleFocusInput = useCallback(() => {
    setShowResults(true);
  }, []);

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

  const handleSelect = node => {
    setShowResults(false);
    onSelect(node);
  };

  return (
    <div className={`taxonomy-search ${classNames || ""}`} ref={containerRef}>
      <div className="taxonomy-search__wrapper">
        <input
          onFocus={handleFocusInput}
          className="taxonomy-search__input"
          type="text"
          value={searchTerm}
          placeholder={i18n.t("table:taxonomy.search-input-placeholder")}
          onChange={handleInput}
          onKeyDown={handleKeyPress}
        />
        <i className="taxonomy-search__icon fa fa-search" />
      </div>
      {showResults ? (
        <div className="taxonomy-search__results">
          <ul className="taxonomy-search__results-list">
            {f.isEmpty(results) ? (
              <EmptyResultsPlaceholder />
            ) : (
              results.map(node => (
                <ResultItem
                  key={node.id}
                  langtag={langtag}
                  onSelect={handleSelect}
                  node={node}
                />
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default TaxonomySearch;
