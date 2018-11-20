import React from "react";
import {branch, compose, pure, renderComponent, withProps, withStateHandlers} from "recompose";
import Moment from "moment";
import f from "lodash/fp";
import {ColumnKinds, DateFormats, DateTimeFormats} from "../../../constants/TableauxConstants";
import DateEditCell from "./DateEditCell";

const enhance = compose(
  pure,
  withProps(
    (props) => {
      const showTime = f.get("kind", props.cell) === ColumnKinds.datetime;
      return {
        showTime,
        Formats: (showTime)
          ? DateTimeFormats
          : DateFormats
      };
    }
  ),
  withStateHandlers(
    (props) => ({value: (f.isEmpty(props.value)) ? null : Moment(props.value)}),
    {
      handleChange: () => (moment) => ({value: moment}),
      clearDate: () => () => ({value: null}),
      saveChanges: (state, props) => () => {
        const {Formats, cell, langtag} = props;
        const curVal = (f.isEmpty(state.value))
          ? null
          : state.value.format(Formats.formatForServer);
        if (curVal === props.value) {
          return;
        }

        const valueToSave = (cell.isMultiLanguage)
          ? {[langtag]: curVal}
          : curVal;
        ActionCreator.changeCell(cell, valueToSave);
      }
    }
  )
);

const DateCell = branch(
  (props) => props.editing,
  renderComponent(DateEditCell)
)(
  ({value, Formats}) => (
    <div className="cell-content">
      {(f.isEmpty(value)) ? "" : value.format(Formats.formatForUser)}
    </div>
  )
);

export default enhance(DateCell);
