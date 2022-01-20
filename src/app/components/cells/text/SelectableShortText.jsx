import f from "lodash/fp";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { compose, withProps } from "recompose";
import { FilterModes } from "../../../constants/TableauxConstants";
import { maybe, stopPropagation } from "../../../helpers/functools";
import SearchFunctions from "../../../helpers/searchFunctions";
import needsAPIData from "../../helperComponents/needsAPIData";
import SelectableCompletionList, {
  ROW_HEIGHT
} from "./SelectableCompletionList";

const LIST_HEIGHT = 200;

const extractAndFilterCompletions = (searchValue, list) =>
  f.flow(
    f.get("values"),
    f.filter(SearchFunctions[FilterModes.CONTAINS](searchValue))
  )(list);

const getCompletionValueUrl = withProps(({ column, table, langtag }) => {
  const colId = column.id;
  const langPostfix = column.multilanguage ? `/${langtag}` : "";
  const requestUrl =
    `/api/tables/${table.id}/columns/${colId}/values` + langPostfix;
  return { requestUrl };
});

const enhance = compose(
  getCompletionValueUrl,
  needsAPIData
);

const SelectableShortText = props => {
  const {
    actions,
    focusTable,
    onBlur,
    requestedData,
    setCellKeyboardShortcuts,
    value
  } = props;

  const [completions, setCompletions] = useState([]);
  const [isCompletionSelected, setIsCompletionSelected] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [shouldInvertList, setShouldInvertList] = useState(false);
  const [curValue, setCurValue] = useState(value);

  useEffect(() => setCellKeyboardShortcuts({}));

  const exitEditMode = () => {
    actions.toggleCellEditing({ editing: false });
    focusTable();
  };
  const handleTextChange = event => {
    const value = event.currentTarget.value;
    const completionsForValue = extractAndFilterCompletions(
      value,
      requestedData
    );
    setCurValue(value);
    setCompletions(completionsForValue);
    setSelectedIdx(f.clamp(0, f.size(completions) - 1, selectedIdx)); // clamp selection inside new list
    setIsCompletionSelected(false);
  };
  const handleSaveEdits = value => onBlur(value);
  const handleSetSelectedIdx = idx => {
    const l = f.size(completions);
    const boundedIdx = (idx + l) % l;
    setSelectedIdx(boundedIdx);
    setIsCompletionSelected(true);
  };
  const updateSelectionIdx = dir => {
    const inv = shouldInvertList ? -1 : 1;
    const idx = selectedIdx + dir * inv;
    handleSetSelectedIdx(idx);
  };
  const applySelectedCompletion = () => {
    const completionValue = f.get(selectedIdx, completions);
    setCompletions(completionValue);
    setIsCompletionSelected(false);
    handleSaveEdits(completionValue);
  };
  const handleMouseSelection = idx => {
    const idxToSet = shouldInvertList ? f.size(completions) - 1 - idx : idx;
    handleSetSelectedIdx(idxToSet);
    exitEditMode();
  };
  const handleKeyPress = event => {
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowRight":
        return event.stopPropagation();
      case "ArrowUp":
        event.preventDefault();
        event.stopPropagation();
        return updateSelectionIdx(-1);
      case "ArrowDown":
        event.preventDefault();
        event.stopPropagation();
        return updateSelectionIdx(+1);
      case "Escape":
        exitEditMode();
        return focusTable();
      case "Enter":
        event.stopPropagation();
        if (isCompletionSelected) {
          applySelectedCompletion();
        } else {
          handleSaveEdits(curValue);
        }
        exitEditMode();
        return focusTable();
      default:
        return;
    }
  };

  const placeCaret = inputNode => {
    const l = f.size(curValue);
    maybe(inputNode).method("setSelectionRange", l, l);
  };
  const placeCompletionList = listContainerNode => {
    if (f.isNil(listContainerNode)) return;
    const rect = listContainerNode.getBoundingClientRect();
    const h = window.innerHeight;
    setShouldInvertList(rect.bottom + LIST_HEIGHT >= h);
  };

  useEffect(() => {
    requestedData &&
      setCompletions(extractAndFilterCompletions("", requestedData));
  }, [requestedData]);

  const listStyle = shouldInvertList ? { bottom: 35 } : { top: 35 };

  return (
    <div
      className="cell-content editing"
      onKeyDown={handleKeyPress}
      ref={placeCompletionList}
    >
      <input
        ref={placeCaret}
        value={curValue}
        onChange={handleTextChange}
        onMouseDown={stopPropagation}
        onClick={stopPropagation}
        autoFocus
      />
      {!f.isNil(requestedData) && f.isEmpty(completions) ? null : (
        <div
          className="completion-list"
          style={{
            ...listStyle,
            height: f.clamp(
              ROW_HEIGHT,
              LIST_HEIGHT,
              ROW_HEIGHT * f.size(completions)
            )
          }}
        >
          <SelectableCompletionList
            completions={
              shouldInvertList ? f.reverse(completions) : completions
            }
            selected={
              shouldInvertList
                ? f.size(completions) - selectedIdx - 1
                : selectedIdx
            }
            requestedData={requestedData}
            handleSelection={handleMouseSelection}
            handleClick={applySelectedCompletion}
          />
        </div>
      )}
    </div>
  );
};

SelectableShortText.propTypes = {
  onBlur: PropTypes.func.isRequired,
  setCellKeyboardShortcuts: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  displayValue: PropTypes.object
};

export default enhance(SelectableShortText);
