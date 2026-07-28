import React, { Fragment, useMemo } from "react";
import PropTypes from "prop-types";

import { buildClassName } from "../../../helpers/buildClassName";
import { getTaxonomyPathLayout } from "./taxonomyPathLayout";

const TaxonomyPath = ({ nodes, availableWidth }) => {
  const { nodes: displayNodes, firstNodeMaxWidth } = useMemo(
    () => getTaxonomyPathLayout(nodes, availableWidth),
    [nodes, availableWidth]
  );

  const lastIndex = displayNodes.length - 1;

  return displayNodes.map((node, index) => {
    const muted = index !== lastIndex;

    return (
      <Fragment key={index}>
        {index > 0 && (
          <span
            className={buildClassName("taxonomy-path-separator", {
              muted: true
            })}
          >
            {" > "}
          </span>
        )}
        <span
          className={buildClassName("taxonomy-path-node", { muted })}
          style={
            index === 0 && firstNodeMaxWidth
              ? { maxWidth: firstNodeMaxWidth }
              : undefined
          }
        >
          {node}
        </span>
      </Fragment>
    );
  });
};

TaxonomyPath.propTypes = {
  nodes: PropTypes.arrayOf(PropTypes.string).isRequired,
  availableWidth: PropTypes.number
};

export default TaxonomyPath;
