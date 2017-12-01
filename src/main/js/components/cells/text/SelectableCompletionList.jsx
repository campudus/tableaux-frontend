import React from "react";
import f from "lodash/fp";
import {branch, compose, pure, renderComponent, withHandlers} from "recompose";
import {LoadingSpinner} from "../../header/Spinner";
import {AutoSizer, List} from "react-virtualized";

export const ROW_HEIGHT = 40;

const enhance = compose(
  pure,
  branch(
    (props) => f.isNil(props.requestedData),
    renderComponent(LoadingSpinner)
  ),

  withHandlers({
    renderEntry: ({completions, selected, handleClick, handleSelection}) => ({index, style, key}) => {
      const completion = f.get(index, completions);
      const isSelected = index === selected;
      // Need to set unused style here to suppress react-virtualized warnings
      return (
        <CompletionItem style={style}
                        key={key}
                        value={completion}
                        index={index}
                        isSelected={isSelected}
                        handleClick={handleClick}
                        virtualizedStyle={style}
                        handleSelection={handleSelection}
        />
      );
    }
  })
);

const CompletionItem = compose(
  pure,
  withHandlers({
    handleSelection: ({handleSelection, index}) => () => {
      handleSelection(index);
    }
  })
)(
  ({value, isSelected, virtualizedStyle, handleSelection}) => (
    <div className="completion-item-wrapper"
         style={virtualizedStyle}
         onMouseEnter={handleSelection}
    >
      <a href="#"
         className={`completion-item ${(isSelected) ? "selected" : ""}`}
         draggable={false}
      >
        <div className="completion-item-label">{value}</div>
      </a>
    </div>
  )
);

const SelectableCompletionList = ({completions, renderEntry, selected, _fixToScreen}) => {
  return (
    <AutoSizer>
      {({width, height}) => (
        <List className="virtualized-completion-list"
              width={width}
              height={height}
              rowCount={f.size(completions)}
              rowHeight={ROW_HEIGHT}
              rowRenderer={renderEntry}
              scrollToIndex={selected}
        />
      )}
    </AutoSizer>
  );
};

export default compose(
  enhance
)(SelectableCompletionList);
