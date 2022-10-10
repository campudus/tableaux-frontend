import React, { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import * as t from "./taxonomy";
import f from "lodash/fp";
import { retrieveTranslation } from "../../helpers/multiLanguage";

const TreeEntry = ({ node, onClick, children, langtag }) => {
  const handleClick = useCallback(
    event => {
      event.stopPropagation();
      onClick(node);
    },
    [node.id, node.expanded]
  );
  const childCount = `(${node.children.length})`;
  const childrenToRender = node.expanded || node.onPath ? node.children : null;

  return (
    <li onClick={handleClick} style={{ paddingLeft: "24px" }}>
      <span>{retrieveTranslation(langtag, node.displayValue)}</span>
      {t.isLeaf(node) ? null : <span>{childCount}</span>}
      {childrenToRender ? (
        <ul>
          {childrenToRender.map(n => (
            <TreeEntry
              key={n.id}
              node={n}
              onClick={onClick}
              langtag={langtag}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
};

const TaxonomyTable = ({ langtag, tableId }) => {
  const rows = useSelector(f.propOr([], ["rows", tableId, "data"]));
  const [expandedNodeId, setExpandedNodeId] = useState(null);

  const tree = f.compose(
    t.buildTree({ expandedNodeId }),
    t.tableToTreeNodes
  )({ rows });

  const toggleExpandNode = node => {
    setExpandedNodeId(expandedNodeId === node.id ? node.parent : node.id);
  };

  return (
    <section className="taxonomy-tree">
      <ul>
        {tree.map(node => (
          <TreeEntry
            key={node.id}
            node={node}
            onClick={toggleExpandNode}
            langtag={langtag}
          />
        ))}
      </ul>
    </section>
  );
};

TaxonomyTable.displayName = "TaxonomyTable";

export default TaxonomyTable;
