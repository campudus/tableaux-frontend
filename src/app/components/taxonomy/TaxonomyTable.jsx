import f from "lodash/fp";
import React from "react";
import { useSelector } from "react-redux";
import * as t from "./taxonomy";
import TreeView from "./TreeView";

const shouldShowAction = ({ node, expandedNodeId }) =>
  (!node.parent && !expandedNodeId) || node.parent === expandedNodeId;

const TableEditor = () => <span>X</span>;

const TaxonomyTable = ({ langtag, tableId }) => {
  const rows = useSelector(f.propOr([], ["rows", tableId, "data"]));
  const nodes = t.tableToTreeNodes({ rows });

  return (
    <TreeView
      nodes={nodes}
      langtag={langtag}
      shouldShowAction={shouldShowAction}
      NodeActionItem={TableEditor}
    />
  );
};

TaxonomyTable.displayName = "TaxonomyTable";

export default TaxonomyTable;
