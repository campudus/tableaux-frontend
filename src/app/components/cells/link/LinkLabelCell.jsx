import React from "react";
import PropTypes from "prop-types";
// import {loadAndOpenEntityView} from "../../overlay/EntityViewOverlay";
import * as f from "lodash/fp";
import { compose, pure, withHandlers } from "recompose";
import Empty from "../../helperComponents/emptyEntry";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import { when } from "../../../helpers/functools";

const LinkLabelCell = props => {
  const {
    value,
    column,
    clickable,
    langtag,
    linkElement,
    linkIndexAt,
    displayValue,
    displayValues
  } = props;
  const { id } = value;
  const linkName = f.isEmpty(displayValues)
    ? retrieveTranslation(langtag)(displayValue)
    : f.flow(
        f.find(f.propEq("id", id)),
        f.prop(["values", 0]),
        when(f.isObject, retrieveTranslation(langtag))
      )(displayValues);

  return (
    <a href="#" onClick={() => console.log("onClick")} className="link-label">
      <div className="label-text">
        {f.isEmpty(linkName) ? <Empty langtag={langtag} /> : linkName}
      </div>
    </a>
  );
};

// LinkLabelCell.propTypes = {
//   cell: PropTypes.object.isRequired,
//   langtag: PropTypes.string.isRequired,
//   linkIndexAt: PropTypes.number.isRequired,
//   clickable: PropTypes.bool
// };

// const enhance = compose(
//   withHandlers({
//     onClick: ({cell, clickable, langtag, linkElement}) => event => {
//       if (clickable) {
//         event.stopPropagation();
//         loadAndOpenEntityView(
//           {
//             tables: cell.tables,
//             tableId: cell.column.toTable,
//             rowId: linkElement.id
//           },
//           langtag
//         );
//       }
//     },
//     getLinkName: ({langtag, cell, linkIndexAt}) => () =>
//       f.find(
//         // first truthy value
//         f.complement(f.isEmpty),
//         [
//           ...f.props([langtag, DefaultLangtag], cell.displayValue[linkIndexAt]),
//           <Empty />
//         ]
//       )
//   }),
//   pure
// );

module.exports = LinkLabelCell;
