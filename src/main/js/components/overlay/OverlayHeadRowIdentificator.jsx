import React from "react";
import PropTypes from "prop-types";
import RowConcat from "../../helpers/RowConcatHelper";
import {compose, lifecycle, pure, withHandlers, withState} from "recompose";
import Dispatcher from "../../dispatcher/Dispatcher";
import {ActionTypes} from "../../constants/TableauxConstants";
import f from "lodash/fp";

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
  withState("rowIdentification", "setRowIdentification"),
  withHandlers({
    updateRowIdentification: ({setRowIdentification, cell, langtag}) => (msg) => {
      if (cell === msg.cell) {
        setRowIdentification(f.always(<RowConcat row={cell.row} langtag={langtag} />));
      }
    }
  }),
  lifecycle(
    {
      componentDidMount() {
        const {cell, updateRowIdentification} = this.props;
        Dispatcher.on(ActionTypes.BROADCAST_DATA_CHANGE, updateRowIdentification);
        updateRowIdentification({cell}); // set Initial value
      },
      componentWillUnmount() {
        Dispatcher.off(ActionTypes.BROADCAST_DATA_CHANGE, this.props.updateRowIdentification);
      }
    }
  )
);

OverlayHeadRowIdentificator.propTypes = {
  cell: PropTypes.object,
  langtag: PropTypes.string.isRequired
};

export default updateOnCellChange(OverlayHeadRowIdentificator);
