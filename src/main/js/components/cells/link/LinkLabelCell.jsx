import React from "react";
import PropTypes from "prop-types";
import {loadAndOpenEntityView} from "../../overlay/EntityViewOverlay";
import * as f from "lodash/fp";
import {DefaultLangtag} from "../../../constants/TableauxConstants";
import {compose, pure, withHandlers} from "recompose";
import Empty from "../../helperComponents/emptyEntry";

const LinkLabelCell = (props) => {
  const {onClick, getLinkName} = props;

  return <a href="#" onClick={onClick} className="link-label">
    <div className="label-text">{getLinkName()}</div>
  </a>;
};

LinkLabelCell.propTypes = {
  cell: PropTypes.object.isRequired,
  linkElement: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  linkIndexAt: PropTypes.number.isRequired,
  clickable: PropTypes.bool
};

const enhance = compose(
  withHandlers({
    onClick: ({cell, clickable, langtag, linkElement}) => (event) => {
      if (clickable) {
        event.stopPropagation();
        loadAndOpenEntityView(
          {
            tables: cell.tables,
            tableId: cell.column.toTable,
            rowId: linkElement.id
          },
          langtag);
      }
    },
    getLinkName: ({langtag, cell, linkIndexAt}) => () => f.find( // first truthy value
      f.complement(f.isEmpty),
      [...f.props([langtag, DefaultLangtag], cell.displayValue[linkIndexAt]), <Empty/>]
    )
  }),
  pure
);

module.exports = enhance(LinkLabelCell);
