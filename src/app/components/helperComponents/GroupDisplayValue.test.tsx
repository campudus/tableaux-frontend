import { describe, expect, it, vi } from "vitest";

// SvgIcon fetches its svg over HTTP and injects it as innerHTML; which icon it
// was asked for is all this test needs.
vi.mock("./SvgIcon", () => ({
  default: ({
    icon,
    containerClasses
  }: {
    icon: string;
    containerClasses?: string;
  }) => <i className={`svg-icon ${containerClasses}`} data-icon={icon} />
}));

import { ReactElement } from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { GroupDisplayColumn } from "../../helpers/groupDisplayValue";
import GroupDisplayValue from "./GroupDisplayValue";

const langtag = "de-DE";

const column: GroupDisplayColumn = {
  kind: "group",
  formatPattern: "{{1}} / {{2}}",
  groups: [
    {
      id: 1,
      name: "webshop",
      kind: "boolean",
      displayName: { "de-DE": "Webshop" }
    },
    { id: 2, name: "sale", kind: "boolean", displayName: { "de-DE": "Sale" } }
  ]
};

const render = (element: ReactElement) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    ReactDOM.render(element, container);
  });

  return container;
};

describe("GroupDisplayValue", () => {
  it("renders a check for a true and a cross for a false member", () => {
    const container = render(
      <GroupDisplayValue
        column={column}
        value={[true, false]}
        langtag={langtag}
      />
    );
    const booleans = [...container.querySelectorAll(".group-boolean")];

    expect(booleans.map(el => el.textContent)).toEqual(["Webshop", "Sale"]);
    expect(booleans.map(el => el.className)).toEqual([
      "group-boolean group-boolean--true",
      "group-boolean group-boolean--false"
    ]);
    expect(
      booleans.map(el =>
        el.querySelector(".svg-icon")?.getAttribute("data-icon")
      )
    ).toEqual(["check", "cross"]);
    // The separator of the format pattern survives between the two members.
    expect(container.textContent).toBe("Webshop / Sale");
  });
});
