import React from "react";
import f from "lodash/fp";
import PropTypes from "prop-types";
import {compose, lifecycle, withHandlers, withProps, withStateHandlers} from "recompose";
import {maybe} from "../../../helpers/functools";
import ActionCreator from "../../../actions/ActionCreator";
import needsAPIData from "../../helperComponents/needsAPIData";
import SearchFunctions from "../../../helpers/searchFunctions";
import {FilterModes} from "../../../constants/TableauxConstants";
import SelectableCompletionList, {ROW_HEIGHT} from "./SelectableCompletionList";

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
      invertList: false
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
      modifySelection: ({selected, completions, invertList}) => (dir) => {
        const inversion = (invertList) ? -1 : 1;
        const len = f.size(completions);
        const selection = (selected + len + dir * inversion) % len;
        return {
          selected: selection,
          completionSelected: true
        };
      },
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
        const invertList = (rect.bottom + LIST_HEIGHT >= h);
        const listStyle = (invertList)
          ? { bottom: 35 }
          : { top: 35 };

        return {listStyle, invertList};
      }
    }
  ),
  withHandlers({
    selectNextCompletion: ({modifySelection}) => () => modifySelection(1),
    selectPrevCompletion: ({modifySelection}) => () => modifySelection(-1)
  }),
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
    requestedData,
    placeCompletionList,
    listStyle,
    invertList
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
      <div className="completion-list"
           style={{
             ...listStyle,
             height: f.clamp(ROW_HEIGHT, LIST_HEIGHT, ROW_HEIGHT * f.size(completions))
           }}
      >
        <SelectableCompletionList completions={(invertList) ? f.reverse(completions) : completions}
                                  selected={(invertList) ? f.size(completions) - selected - 1 : selected}
                                  requestedData={requestedData}
                                  handleSelection={setSelectedCompletion}
        />
      </div>
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
