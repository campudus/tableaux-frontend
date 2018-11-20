import React from "react";
import PropTypes from "prop-types";
import RowConcat from "../../helpers/RowConcatHelper";
import {compose, lifecycle, pure, withStateHandlers} from "recompose";
// import Dispatcher from "../../dispatcher/Dispatcher";
import {ActionTypes} from "../../constants/TableauxConstants";

const OverlayHeadRowIdentificator = (props) => {
  const {cell, cell: {column}, langtag, rowIdentification} = props;
  if (!cell) {
    return null;
  }
  const columnDisplayName = column.displayName[langtag] || column.name;

  return (
    <span>
      <span className="column-name">
        {columnDisplayName}:{" "}
      </span>
      {rowIdentification}
    </span>
  );
};

const updateOnCellChange = compose(
  pure,
  withStateHandlers(
    (props) => ({
      rowIdentification: <RowConcat row={props.cell.row} langtag={props.langtag}/>
    }),
    {
      updateRowIdentification: (state, {cell, langtag}) => (evt, msg) => {
        if (evt === ActionTypes.BROADCAST_DATA_CHANGE && cell === msg.cell) {
          return {
            rowIdentification: <RowConcat row={cell.row} langtag={langtag} />
          };
        }
      }
  }),
  lifecycle(
    {
      componentDidMount() {
        const {cell, updateRowIdentification} = this.props;
        // Dispatcher.on("all", updateRowIdentification);
        updateRowIdentification({cell}); // set Initial value
      },
      componentWillUnmount() {
        // Dispatcher.off("all", this.props.updateRowIdentification);
      }
    }
  )
);

OverlayHeadRowIdentificator.propTypes = {
  cell: PropTypes.object,
  langtag: PropTypes.string.isRequired
};

export default updateOnCellChange(OverlayHeadRowIdentificator);
