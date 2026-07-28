import React, { Fragment, useMemo } from "react";
import PropTypes from "prop-types";

import { getTaxonomyPathLayout } from "./taxonomyPathLayout";

const TaxonomyPath = ({ nodes, availableWidth }) => {
  const { nodes: displayNodes, firstNodeMaxWidth } = useMemo(
    () => getTaxonomyPathLayout(nodes, availableWidth),
    [nodes, availableWidth]
  );

  return displayNodes.map((node, index) => (
    <Fragment key={index}>
      {index > 0 && <span className="taxonomy-path-separator"> &gt; </span>}
      <span
        className="taxonomy-path-node"
        style={
          index === 0 && firstNodeMaxWidth
            ? { maxWidth: firstNodeMaxWidth }
            : undefined
        }
      >
        {node}
      </span>
    </Fragment>
  ));
};

TaxonomyPath.propTypes = {
  nodes: PropTypes.arrayOf(PropTypes.string).isRequired,
  availableWidth: PropTypes.number
};

export default TaxonomyPath;
