import React from "react";
import { branch, renderComponent } from "recompose";
import i18n from "i18next";

const ElementCountWithPercents = ({ n, flag, selected, perc }) => {
  const gotoString =
    flag === "comments"
      ? "dashboard:flag.goto-comment"
      : "dashboard:flag.goto-table";
  return selected ? (
    <div className={"element-count"}>
      {i18n.t(gotoString)}
      <i className="fa fa-long-arrow-right" />
    </div>
  ) : (
    <div className={"element-count"}>
      {n}
      <span className="percent">({perc}%)</span>
    </div>
  );
};

const DefaultElementCount = ({ n, flag, selected }) => {
  const gotoString =
    flag === "comments"
      ? "dashboard:flag.goto-comment"
      : "dashboard:flag.goto-table";
  return selected ? (
    <div className={"element-count"}>
      {i18n.t(gotoString)}
      <i className="fa fa-long-arrow-right" />
    </div>
  ) : (
    <div className={"element-count"}>{n}</div>
  );
};

export default branch(
  props => props.flag === "needs_translation",
  renderComponent(ElementCountWithPercents)
)(DefaultElementCount);
