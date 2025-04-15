import f from "lodash/fp";
import PropTypes from "prop-types";
import React, { useEffect, useRef, useState } from "react";
import { compose, withProps } from "recompose";
import { FilterModes } from "../../../constants/TableauxConstants";
import { stopPropagation } from "../../../helpers/functools";
import SearchFunctions from "../../../helpers/searchFunctions";
import needsAPIData from "../../helperComponents/needsAPIData";
import SelectableCompletionList, {
  ROW_HEIGHT
} from "./SelectableCompletionList";
import i18n from "i18next";
import {
  columnHasMaxLength,
  columnHasMinLength,
  getTextLength,
  isTextTooLong,
  isTextTooShort
} from "../../../helpers/limitTextLength";
import useOutsideAlerter from "../../helperComponents/useOutsideAlerter";

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

const enhance = compose(getCompletionValueUrl, needsAPIData);

const SelectableShortText = props => {
  const {
    focusTable,
    onChange,
    onFinish,
    requestedData,
    setCellKeyboardShortcuts,
    value,
    column,
    actions: { setPreventCellDeselection }
  } = props;
  const shorttextRef = useRef(null);
  const [completions, setCompletions] = useState([]);
  const [isCompletionSelected, setIsCompletionSelected] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [shouldInvertList, setShouldInvertList] = useState(false);
  const [shouldShowErrorState, setShouldShowErrorState] = useState(false);
  const textTooShortErrorCssClass =
    shouldShowErrorState && isTextTooShort(column, value)
      ? "selectable-shorttext_error"
      : "";

  useEffect(() => setCellKeyboardShortcuts({}));
  useOutsideAlerter(() => {
    setShouldShowErrorState(true);
  }, shorttextRef);

  const handleTextChange = event => {
    const inputValue = event.currentTarget.value;
    const completionsForValue = extractAndFilterCompletions(
      inputValue,
      requestedData
    );
    if (isTextTooLong(column, inputValue)) return;
    if (isTextTooShort(column, inputValue)) {
      setPreventCellDeselection({ value: true });
    } else {
      setPreventCellDeselection({ value: false });
    }
    onChange(inputValue);
    setCompletions(completionsForValue);
    setSelectedIdx(f.clamp(0, f.size(completions) - 1, selectedIdx)); // clamp selection inside new list
    setIsCompletionSelected(false);
    setShouldShowErrorState(false);
  };

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
    if (isTextTooShort(column, completionValue)) {
      onChange(completionValue);
      setPreventCellDeselection({ value: true });
      return;
    }
    if (isTextTooLong(column, completionValue)) {
      onChange(f.take(column.maxLength, completionValue));
      setPreventCellDeselection({ value: false });
      return;
    }
    setPreventCellDeselection({ value: false });
    onFinish(true, completionValue);
  };
  const handleMouseSelection = idx => {
    const idxToSet = shouldInvertList ? f.size(completions) - 1 - idx : idx;
    handleSetSelectedIdx(idxToSet);
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
        setPreventCellDeselection({ value: false });
        onFinish(false);
        return focusTable();
      case "Enter":
        event.stopPropagation();
        if (isCompletionSelected) {
          applySelectedCompletion(); // implicit finish
        } else {
          if (isTextTooShort(column, value)) {
            setShouldShowErrorState(true);
            return;
          }
          onFinish();
        }
        return focusTable();
      default:
        return;
    }
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

  useEffect(() => {
    placeCompletionList(shorttextRef.current);
  }, [shorttextRef]);

  const listStyle = shouldInvertList ? { bottom: 35 } : { top: 35 };

  const { minLength, maxLength } = column;
  const minLengthText = columnHasMinLength(column)
    ? i18n.t("table:text-length:min-length-short", { minLength })
    : "";
  const maxLengthText = columnHasMaxLength(column)
    ? `${getTextLength(value)}/${maxLength}`
    : "";
  const editorRef = useRef();
  useEffect(
    () => void requestAnimationFrame(() => void editorRef.current?.focus()),
    [editorRef.current]
  );

  return (
    <div
      className="cell-content editing"
      onKeyDown={handleKeyPress}
      ref={shorttextRef}
    >
      <input
        className={textTooShortErrorCssClass}
        value={value}
        onChange={handleTextChange}
        onMouseDown={stopPropagation}
        onClick={stopPropagation}
        autoFocus
        ref={editorRef}
      />
      <div className="selectable-shorttext_text-limits">
        <div className={textTooShortErrorCssClass}>{minLengthText}</div>
        <div className="selectable-shorttext_max-length">{maxLengthText}</div>
      </div>
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
  onChange: PropTypes.func.isRequired,
  onFinish: PropTypes.func.isRequired,
  setCellKeyboardShortcuts: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  displayValue: PropTypes.object
};

export default enhance(SelectableShortText);
