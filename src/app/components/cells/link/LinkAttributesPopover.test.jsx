import { beforeEach, describe, expect, it, vi } from "vitest";

// Only *whether* it saves; what a save does is covered by
// linkAttributes.store.test.js. Hence the mocked action creator.
vi.mock("../../../redux/actionCreators", () => ({
  default: {
    changeLinkAttributes: vi.fn(() => () => Promise.resolve()),
    showToast: vi.fn(() => () => Promise.resolve())
  }
}));

import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { Provider } from "react-redux";
import actions from "../../../redux/actionCreators";
import store from "../../../redux/store";
import LinkAttributesPopover from "./LinkAttributesPopover";

const langtag = "de-DE";
const linkId = 1;

const cell = {
  table: { id: 1 },
  row: { id: 10 },
  column: {
    id: 5,
    kind: "link",
    toTable: 2,
    linkAttributes: [
      { name: "active", kind: "boolean", displayName: { [langtag]: "Aktiv" } }
    ],
    formatPattern: "{{value}} {{attributes.active}}"
  },
  value: [{ id: linkId, value: { [langtag]: "Grau" }, attributes: [null] }]
};

const renderPopover = () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const onClose = vi.fn();

  act(() => {
    ReactDOM.render(
      <Provider store={store}>
        <LinkAttributesPopover
          cell={cell}
          linkId={linkId}
          attributes={[null]}
          langtag={langtag}
          floatingRef={() => null}
          floatingStyles={{}}
          onClose={onClose}
        />
      </Provider>,
      container
    );
  });

  return {
    onClose,
    unmount: () => act(() => void ReactDOM.unmountComponentAtNode(container)),
    // a boolean renders as the Toggle, whose checkbox can be clicked without
    // faking React's value setter
    toggle: () => document.querySelector(".toggle__input"),
    press: key =>
      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key, bubbles: true })
        );
      })
  };
};

describe("LinkAttributesPopover: when a draft is saved", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    actions.changeLinkAttributes.mockClear();
  });

  it("renders the boolean attribute as a toggle", () => {
    const { toggle, unmount } = renderPopover();

    expect(toggle()).not.toBe(null);
    expect(toggle().checked).toBe(false);
    unmount();
  });

  it("saves the draft on Enter", () => {
    const { toggle, press, onClose, unmount } = renderPopover();

    act(() => void toggle().click());
    press("Enter");

    expect(actions.changeLinkAttributes).toHaveBeenCalledWith({
      cell,
      linkId,
      attributes: [true]
    });
    expect(onClose).toHaveBeenCalled();
    unmount();
  });

  it("discards the draft on Escape", () => {
    const { toggle, press, onClose, unmount } = renderPopover();

    act(() => void toggle().click());
    press("Escape");

    expect(actions.changeLinkAttributes).not.toHaveBeenCalled();
    // discarding still closes -- the draft is simply dropped
    expect(onClose).toHaveBeenCalled();
    unmount();
  });

  it("does not save when nothing was touched", () => {
    const { press, onClose, unmount } = renderPopover();

    press("Enter");

    expect(actions.changeLinkAttributes).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    unmount();
  });
});
