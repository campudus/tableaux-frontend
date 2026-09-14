import React, { useCallback } from "react";
import f from "lodash/fp";
import { LoadingSpinner } from "../../header/Spinner";
import { AutoSizer, List } from "react-virtualized";

export const ROW_HEIGHT = 40;

const CompletionItem = React.memo(
  ({
    value,
    index,
    isSelected,
    virtualizedStyle,
    handleSelection,
    handleClick
  }) => {
    const onSelect = useCallback(() => {
      handleSelection(index);
    }, [handleSelection, index]);

    return (
      <div
        className="completion-item-wrapper"
        style={virtualizedStyle}
        onMouseEnter={onSelect}
      >
        <button
          className={`completion-item ${isSelected ? "selected" : ""}`}
          draggable={false}
          onMouseDownCapture={handleClick}
        >
          <div className="completion-item-label">{value}</div>
        </button>
      </div>
    );
  }
);

const SelectableCompletionList = props => {
  const {
    completions,
    selected,
    handleClick,
    handleSelection,
    requestedData
  } = props;

  const renderEntry = ({ index, style, key }) => {
    const completion = f.get(index, completions);
    const isSelected = index === selected;
    // Need to set unused style here to suppress react-virtualized warnings
    return (
      <CompletionItem
        style={style}
        key={key}
        value={completion}
        index={index}
        isSelected={isSelected}
        handleClick={handleClick}
        virtualizedStyle={style}
        handleSelection={handleSelection}
      />
    );
  };

  if (f.isNil(requestedData)) {
    return <LoadingSpinner {...props} />;
  }

  return (
    <AutoSizer>
      {({ width, height }) => (
        <List
          className="virtualized-completion-list"
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

export default React.memo(SelectableCompletionList);
