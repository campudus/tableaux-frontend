export const ENABLE_DASHBOARD = true;
export const SHOW_DASHBOARD_USER_NAME = false;
export const KEYBOARD_TABLE_HISTORY = true;
export const ENABLE_HISTORY = process.env.ENABLE_HISTORY !== "false";
export const SHOW_TABLE_DROPDOWN = process.env.SHOW_TABLE_DROPDOWN !== "false";

console.log(
  "Environment:",
  process.env.ENABLE_HISTORY,
  process.env.SHOW_TABLE_DROPDOWN
);
