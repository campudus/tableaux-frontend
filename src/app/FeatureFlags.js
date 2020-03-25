export const ENABLE_DASHBOARD = true;
export const SHOW_DASHBOARD_USER_NAME = false;
export const KEYBOARD_TABLE_HISTORY = true;
export let ENABLE_HISTORY = process.env.ENABLE_HISTORY !== "false";
export let SHOW_TABLE_DROPDOWN = process.env.SHOW_TABLE_DROPDOWN !== "false";
//overwrite with values from config in production mode
if (process.env.NODE_ENV !== "development") {
  fetch("/config.json")
    .then(res => res.json())
    .then(({ enableHistory, showTableDropdown }) => {
      ENABLE_HISTORY = enableHistory !== "false";
      SHOW_TABLE_DROPDOWN = showTableDropdown !== "false";
      console.log("Environment:", ENABLE_HISTORY, SHOW_TABLE_DROPDOWN);
    });
} else {
  console.log("Environment:", ENABLE_HISTORY, SHOW_TABLE_DROPDOWN);
}
