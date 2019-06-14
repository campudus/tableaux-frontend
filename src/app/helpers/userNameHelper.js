import Cookie from "js-cookie";

export const getUserName = () => Cookie.get("userName") || "John Doe";
