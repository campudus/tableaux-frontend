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

const clickButton = (button: Element) => {
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
};

const openCriterionMenu = (container: HTMLElement) =>
  clickButton(container.querySelectorAll("button").item(0));

const menuButtons = () => [
  ...document.querySelectorAll(".button-action__menu button")
];

describe("DirentOrderControl", () => {
  const order: DirentOrder = { criterion: "by-type", direction: "desc" };

  it("offers every criterion in a dropdown", () => {
    openCriterionMenu(render(order, () => undefined));
    expect(menuButtons()).toHaveLength(3);
  });

  it("selects the chosen criterion and keeps the direction", () => {
    const onChange = vi.fn();
    openCriterionMenu(render(order, onChange));
    menuButtons().forEach((button, index) => {
      if (index === 2) clickButton(button);
    });
    expect(onChange).toHaveBeenCalledWith({
      criterion: "by-date",
      direction: "desc"
    });
  });

  it("flips the direction with the right button", () => {
    const onChange = vi.fn();
    const container = render(order, onChange);
    clickButton(container.querySelectorAll("button").item(1));
    expect(onChange).toHaveBeenCalledWith({
      criterion: "by-type",
      direction: "asc"
    });
  });
});
