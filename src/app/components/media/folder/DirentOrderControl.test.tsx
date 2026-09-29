import { describe, expect, it, vi } from "vitest";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import DirentOrderControl from "./DirentOrderControl";
import { DirentOrder } from "./direntOrdering";

const render = (order: DirentOrder, onChange: (order: DirentOrder) => void) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    ReactDOM.render(
      <DirentOrderControl order={order} onChange={onChange} />,
      container
    );
  });
  return container;
};

const clickButton = (container: HTMLElement, index: number) => {
  const button = container.querySelectorAll("button").item(index);
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
};

describe("DirentOrderControl", () => {
  const order: DirentOrder = { criterion: "by-name", direction: "asc" };

  it("shows icons for criterion and direction, and no text", () => {
    const container = render(order, () => undefined);
    expect([...container.querySelectorAll("i")].map(i => i.className)).toEqual([
      "icon fa fa-font",
      "icon fa fa-sort-amount-asc"
    ]);
    expect(container.textContent).toBe("");
  });

  it("keeps the criterion icon when the direction changes", () => {
    const iconOf = (direction: DirentOrder["direction"]) =>
      render(
        { criterion: "by-name", direction },
        () => undefined
      ).querySelector("i")?.className;
    expect(iconOf("desc")).toBe(iconOf("asc"));
  });

  it("switches to the next criterion with the left button", () => {
    const onChange = vi.fn();
    clickButton(render(order, onChange), 0);
    expect(onChange).toHaveBeenCalledWith({
      criterion: "by-type",
      direction: "asc"
    });
  });

  it("flips the direction with the right button", () => {
    const onChange = vi.fn();
    clickButton(render(order, onChange), 1);
    expect(onChange).toHaveBeenCalledWith({
      criterion: "by-name",
      direction: "desc"
    });
  });
});
