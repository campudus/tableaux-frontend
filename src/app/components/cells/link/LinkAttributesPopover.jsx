import React, { useEffect, useRef, useState } from "react";
import * as f from "lodash/fp";
import i18n from "i18next";
import Moment from "moment";
import ReactDatetime from "react-datetime";
import listensToClickOutside from "react-onclickoutside";
import { Portal } from "react-portal";
import { useDispatch } from "react-redux";
import actions from "../../../redux/actionCreators";
import {
  ColumnKinds,
  DateFormats,
  DateTimeFormats
} from "../../../constants/TableauxConstants";
import { getDecimalDigits } from "../../../helpers/columnHelper";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import { outsideClickEffect } from "../../../helpers/useOutsideClick";
import {
  getLinkAttributeDefinitions,
  parseAttributeInput,
  toAttributeInputValue
} from "../../../helpers/linkAttributes";
import NumberInput from "../../helperComponents/NumberInput";

// Same wrapping used by DateCell.jsx / DateView.jsx / HistoryFilterArea.jsx --
// react-datetime doesn't portal its calendar, so click-outside-to-close is
// handled by react-onclickoutside instead of relying on this popover's own
// (much coarser) outside-click handling.
const Datetime = listensToClickOutside(ReactDatetime.default ?? ReactDatetime);

// Compact date/datetime attribute input: a trigger button showing the
// current value (like HistoryFilterArea.jsx's history-date-picker), which
// opens an inline react-datetime calendar (input={false}, calendar only).
const DateAttributeInput = ({ definition, value, onChange, autoFocus }) => {
  const [open, setOpen] = useState(false);
  const showTime = definition.kind === ColumnKinds.datetime;
  const Formats = showTime ? DateTimeFormats : DateFormats;
  const hasValue = Moment.isMoment(value) && value.isValid();

  return (
    <div className="link-attributes-popover__date-picker">
      <button
        type="button"
        className="link-attributes-popover__date-trigger"
        onClick={() => setOpen(o => !o)}
        autoFocus={autoFocus}
      >
        <i className="fa fa-calendar" />
        <span>
          {hasValue
            ? value.format(Formats.formatForUser)
            : `(${i18n.t("common:empty").toUpperCase()})`}
        </span>
      </button>
      {hasValue && (
        <button
          type="button"
          className="link-attributes-popover__date-clear"
          onClick={() => onChange(null)}
        >
          <i className="fa fa-minus-circle" />
        </button>
      )}
      {open && (
        <div className="link-attributes-popover__date-calendar">
          <Datetime
            open
            input={false}
            value={value ?? undefined}
            timeFormat={showTime}
            onChange={onChange}
            handleClickOutside={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

// Per-kind input for a single link attribute definition. Multilanguage
// attributes are out of scope for now (see linkAttributes.ts) -- they render
// disabled with a hint instead of a langtag-per-input UI.
const AttributeInput = ({ definition, value, onChange, autoFocus }) => {
  if (definition.multilanguage) {
    return (
      <input
        type="text"
        className="link-attributes-popover__input"
        value={value ?? ""}
        disabled
        placeholder={i18n.t("table:link-attributes.multilanguage-unsupported")}
      />
    );
  }

  switch (definition.kind) {
    case ColumnKinds.boolean:
      return (
        <input
          type="checkbox"
          className="link-attributes-popover__checkbox"
          checked={value === true}
          onChange={evt => onChange(evt.target.checked)}
          autoFocus={autoFocus}
        />
      );
    case ColumnKinds.numeric:
    case ColumnKinds.integer:
      return (
        <NumberInput
          className="link-attributes-popover__input"
          value={value}
          decimalDigits={getDecimalDigits(definition)}
          onChange={onChange}
          autoFocus={autoFocus}
        />
      );
    case ColumnKinds.date:
    case ColumnKinds.datetime:
      return (
        <DateAttributeInput
          definition={definition}
          value={value}
          onChange={onChange}
          autoFocus={autoFocus}
        />
      );
    case ColumnKinds.text:
    default:
      return (
        <input
          type="text"
          className="link-attributes-popover__input"
          value={value ?? ""}
          onChange={evt => onChange(evt.target.value)}
          autoFocus={autoFocus}
        />
      );
  }
};

// Small anchored popover for editing a single link edge's attribute values,
// opened by clicking a linked item's display value in the LinkOverlay or the
// detail EntityView. Positioned with @floating-ui/react-dom (see LinkItem.jsx,
// which owns the `useFloating()` call since it also owns the trigger
// element). Auto-saves via the dedicated attributes endpoint when closed
// (outside click, Escape, or Enter).
const LinkAttributesPopover = ({
  cell,
  linkId,
  attributes,
  langtag,
  floatingRef,
  floatingStyles,
  onClose
}) => {
  const dispatch = useDispatch();
  const definitions = getLinkAttributeDefinitions(cell.column);

  const [draft, setDraft] = useState(() =>
    definitions.map((definition, index) =>
      toAttributeInputValue({
        definition,
        value: f.get(index, attributes),
        langtag
      })
    )
  );

  const draftRef = useRef(draft);
  const dirtyRef = useRef(false);
  const closingRef = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const handleChange = (index, inputValue) => {
    dirtyRef.current = true;
    setDraft(prev => prev.map((v, i) => (i === index ? inputValue : v)));
  };

  const commit = () => {
    if (!dirtyRef.current) {
      return;
    }
    const payload = definitions.map((definition, index) =>
      parseAttributeInput({ definition, input: draftRef.current[index] })
    );
    dispatch(
      actions.changeLinkAttributes({ cell, linkId, attributes: payload })
    ).catch(() => {
      dispatch(
        actions.showToast({
          content: (
            <div id="link-attributes-error-toast">
              {i18n.t("table:link-attributes.save-error")}
            </div>
          )
        })
      );
    });
  };

  const handleClose = () => {
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;
    commit();
    onClose();
  };

  useEffect(
    outsideClickEffect({
      shouldListen: true,
      containerRef,
      onOutsideClick: handleClose
    }),
    []
  );

  useEffect(() => {
    const handleKeyDown = evt => {
      if (evt.key === "Escape" || evt.key === "Enter") {
        evt.stopPropagation();
        handleClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  // floatingStyles/floatingRef come from LinkItem's useFloating() -- it owns
  // the trigger element, so it also owns the position calculation.
  // containerRef only tracks "is a click inside this popover" for the
  // auto-save-on-close behaviour above.
  const setRefs = node => {
    containerRef.current = node;
    floatingRef(node);
  };

  return (
    <Portal>
      <div
        ref={setRefs}
        className="link-attributes-popover"
        style={floatingStyles}
        onClick={evt => evt.stopPropagation()}
      >
        {definitions.map((definition, index) => {
          const label =
            retrieveTranslation(langtag, definition.displayName || {}) ||
            definition.name;
          const description = retrieveTranslation(
            langtag,
            definition.description || {}
          );
          return (
            <div className="link-attributes-popover__row" key={definition.name}>
              <label className="link-attributes-popover__label">{label}</label>
              {!f.isEmpty(description) && (
                <div className="link-attributes-popover__description">
                  {description}
                </div>
              )}
              <AttributeInput
                definition={definition}
                value={draft[index]}
                onChange={value => handleChange(index, value)}
                autoFocus={index === 0}
              />
            </div>
          );
        })}
      </div>
    </Portal>
  );
};

export default LinkAttributesPopover;
