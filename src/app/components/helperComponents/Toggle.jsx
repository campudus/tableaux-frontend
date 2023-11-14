import React from "react";
import uniqueId from "lodash/fp/uniqueId";
import { buildClassName as cn } from "../../helpers/buildClassName";

export default function Toggle({ className }) {
  const id = uniqueId("toggle");

  return (
    <label className={cn("toggle", null, className)} htmlFor={id}>
      <input className="toggle__input" name="" type="checkbox" id={id} />
      <div className="toggle__fill"></div>
    </label>
  );
}
