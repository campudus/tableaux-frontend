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
import Toggle from "../../helperComponents/Toggle";

// Same wrapping as DateCell.jsx / DateView.jsx: react-datetime doesn't portal
// its calendar, so closing it on an outside click is left to
// react-onclickoutside rather than to this popover's own, much coarser one.
const Datetime = listensToClickOutside(ReactDatetime.default ?? ReactDatetime);

// A trigger button showing the current value, opening an inline calendar --
// same shape as HistoryFilterArea.jsx's history-date-picker.
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

// A toggle sits on the label's line instead of below it (see the row markup
// further down). A multilanguage attribute renders as the disabled hint input
// whatever its kind, so it keeps the stacked layout.
const rendersAsToggle = definition =>
  definition.kind === ColumnKinds.boolean && !definition.multilanguage;

// Per-kind input for one attribute definition, mapped here rather than reusing
// the edit cells (docs/adr/0005-link-attributes-are-not-treated-as-columns.md).
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
      // no autoFocus: the toggle's input is display:none, so focusing it would
      // show nothing -- Escape/Enter are handled on document anyway
      return (
        <Toggle
          className="link-attributes-popover__toggle"
          checked={value === true}
          onChange={evt => onChange(evt.target.checked)}
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

// Anchored popover for editing one link's attribute values. Saves when closed
// by an outside click or Enter, Escape discards the draft. Positioned by
// LinkItem.jsx, which owns the trigger element and therefore the
// `useFloating()` call.
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

  // Nothing was sent yet, so discarding is just closing without the commit.
  const close = ({ save }) => {
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;
    if (save) {
      commit();
    }
    onClose();
  };

  const handleClose = () => close({ save: true });
  const handleCancel = () => close({ save: false });

  useEffect(
    outsideClickEffect({
      shouldListen: true,
      containerRef,
      onOutsideClick: handleClose
    }),
    []
  );

  useEffect(() => {
    // Both keys stop propagation, or they would reach the surrounding
    // LinkOverlay / EntityView and close that too.
    const handleKeyDown = evt => {
      if (evt.key === "Enter") {
        evt.stopPropagation();
        handleClose();
      }
      if (evt.key === "Escape") {
        evt.stopPropagation();
        handleCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  // floatingRef positions the popover (LinkItem's useFloating), containerRef
  // only answers "is this click inside?" for the auto-save above.
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
          const isToggle = rendersAsToggle(definition);
          const input = (
            <AttributeInput
              definition={definition}
              value={draft[index]}
              onChange={value => handleChange(index, value)}
              autoFocus={index === 0}
            />
          );

          return (
            <div className="link-attributes-popover__row" key={definition.name}>
              <div className="link-attributes-popover__head">
                <label className="link-attributes-popover__label">
                  {label}
                </label>
                {isToggle && input}
              </div>
              {!f.isEmpty(description) && (
                <div className="link-attributes-popover__description">
                  {description}
                </div>
              )}
              {!isToggle && input}
            </div>
          );
        })}
      </div>
    </Portal>
  );
};

export default LinkAttributesPopover;
