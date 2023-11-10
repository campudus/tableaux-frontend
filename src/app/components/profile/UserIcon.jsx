import React from "react";
import { getUserName } from "../../helpers/userNameHelper";
import { buildClassName as cn } from "../../helpers/buildClassName";

export default function UserIcon({ className }) {
  const userName = getUserName();
  const userInitials =
    userName
      .match(/^(\w)(?:.+?\s|)(\w)/)
      ?.slice(1, 3)
      .join("")
      .toUpperCase() ?? "JD";

  return <div className={cn("user-icon", null, className)}>{userInitials}</div>;
}
