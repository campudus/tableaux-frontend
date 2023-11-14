import React from "react";
import uniqueId from "lodash/fp/uniqueId";
import { buildClassName as cn } from "../../helpers/buildClassName";

export default function Toggle({ className, checked, onChange }) {
  const id = uniqueId("toggle");

  return (
    <label className={cn("toggle", null, className)} htmlFor={id}>
      <input
        id={id}
        className="toggle__input"
        type="checkbox"
        checked={checked ?? false}
        onChange={onChange}
      />
      <div className="toggle__fill"></div>
    </label>
  );
}
