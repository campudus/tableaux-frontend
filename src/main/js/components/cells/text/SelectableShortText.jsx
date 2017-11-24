import React from "react";
import f from "lodash/fp";
import PropTypes from "prop-types";
import {compose, lifecycle, withProps, withStateHandlers} from "recompose";
import {maybe} from "../../../helpers/functools";
import ActionCreator from "../../../actions/ActionCreator";
import needsAPIData from "../../helperComponents/needsAPIData";
import SearchFunctions from "../../../helpers/searchFunctions";
import {FilterModes} from "../../../constants/TableauxConstants";
import SelectableCompletionList, {ROW_HEIGHT} from "./SelectableCompletionList";
import Portal from "react-portal/es/Portal";

const LIST_WIDTH = 300;
const LIST_HEIGHT = 200;

const extractAndFilterCompletions = (searchValue, list) => f.flow(
  f.get("values"),
  f.filter(SearchFunctions[FilterModes.CONTAINS](searchValue))
)(list);

const getCompletionValueUrl = withProps(
  ({cell, cell: {isMultiLanguage}, langtag}) => {
    const {tableId} = cell;
    const colId = f.get(["column", "id"], cell);
    const requestUrl = `/api/tables/${tableId}/columns/${colId}/values` +
      ((isMultiLanguage) ? `/${langtag}` : "");
    return {requestUrl};
  }
);

const enhance = compose(
  getCompletionValueUrl,
  needsAPIData,
  withStateHandlers(
    ({value, requestedData}) => ({
      curValue: value,
      completions: [],
      selected: 0,
      completionSelected: false,
      listStyle: {}
    }),
    {
      handleChange: ({selected}, {requestedData}) => ({target: {value}}) => {
        const completions = extractAndFilterCompletions(value, requestedData);
        return {
          curValue: value,
          completions,
          selected: f.clamp(0, f.size(completions) - 1, selected)
        };
      },
      setInitialCompletionList: () => (requestedData) => ({
        completions: extractAndFilterCompletions("", requestedData)
      }),
      saveEdits: ({curValue}, {value, onBlur}) => () => {
        onBlur(curValue);
      },
      setCaret: ({curValue}) => (inputNode) => {
        const l = f.size(curValue);
        maybe(inputNode).method("setSelectionRange", l, l);
      },
      selectNextCompletion: ({selected, completions}) => () => ({
        selected: (selected + 1) % f.size(completions),
        completionSelected: true
      }),
      selectPrevCompletion: ({selected, completions}) => () => ({
        selected: (selected + f.size(completions) - 1) % f.size(completions),
        completionSelected: true
      }),
      setSelectedCompletion: ({completions}) => (index) => ({
        selected: (index + f.size(completions)) % f.size(completions),
        completionSelected: true
      }),
      applySelectedCompletion: ({selected, completions}) => () => ({
        curValue: f.get(selected, completions),
        completionSelected: false
      }),
      placeCompletionList: ({completions}) => (node) => {
        if (f.isNil(node)) {
          return;
        }

        const rect = node.getBoundingClientRect();
        const h = window.innerHeight;
        const top = (rect.bottom + LIST_HEIGHT >= h)
          ? rect.bottom - 35 - LIST_HEIGHT
          : rect.bottom + 10;

        return ({
          listStyle: {
            top,
            left: rect.left - 10,
            width: LIST_WIDTH
          }
        });
      }
    }
  ),
  lifecycle({
    componentWillReceiveProps(nextProps) {
      if (f.isNil(this.props.requestedData) && !f.isNil(nextProps.requestedData)) {
        this.props.setInitialCompletionList(nextProps.requestedData);
      }
    },
    componentDidMount() {
      this.props.setCellKeyboardShortcuts({
        left: (event) => {
          event.stopPropagation();
        },
        right: (event) => {
          event.stopPropagation();
        },
        down: (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.props.selectNextCompletion();
        },
        up: (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.props.selectPrevCompletion();
        },
        enter: () => {
          if (this.props.completionSelected) {
            this.props.applySelectedCompletion();
          } else {
            this.props.saveEdits();
            ActionCreator.addRowOrSelectNextCell();
          }
        }
      });
    },
    componentWillUnmount() {
      const {curValue, onBlur, setCellKeyboardShortcuts} = this.props;
      onBlur(curValue);
      setCellKeyboardShortcuts({});
    }
  })
);

const SelectableShortText = (
  {
    handleKeyboard,
    setCaret,
    handleChange,
    saveEdits,
    curValue,
    completions,
    selected,
    setSelectedCompletion,
    applySelectedCompletion,
    requestedData,
    placeCompletionList,
    listStyle
  }) => {
  return (
    <div className="cell-content editing"
         onKeyDown={handleKeyboard}
         ref={placeCompletionList}
    >
      <input ref={setCaret}
             value={curValue}
             onChange={handleChange}
             onBlur={saveEdits}
             autoFocus
      />
      <Portal isOpened>
        <div className="completion-list"
             style={{
               ...listStyle,
               height: f.clamp(ROW_HEIGHT, LIST_HEIGHT, ROW_HEIGHT * f.size(completions))
             }}
        >
          <SelectableCompletionList completions={completions}
                                    selected={selected}
                                    requestedData={requestedData}
                                    handleSelection={setSelectedCompletion}
          />
        </div>
      </Portal>
    </div>
  );
};

SelectableShortText.propTypes = {
  cell: PropTypes.object.isRequired,
  onBlur: PropTypes.func.isRequired,
  setCellKeyboardShortcuts: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired
};

export default enhance(SelectableShortText);
