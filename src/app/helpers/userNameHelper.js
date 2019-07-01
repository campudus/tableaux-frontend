import { NO_AUTH_IN_DEV_MODE } from "../FeatureFlags";
import { firstValidPropOr } from "./functools";
import { getLogin } from "./authenticate";

export const getUserName = (onlyFirstName = false) => {
  const keycloak = getLogin();

  const fallbackUserName =
    process.env.NODE_ENV === "production" ? "John Doe" : "GRUDling";
  return process.env.NODE_ENV === "development" && NO_AUTH_IN_DEV_MODE
    ? fallbackUserName
    : firstValidPropOr(
        fallbackUserName,
        [onlyFirstName ? "given_name" : "name", "preferred_username"],
        keycloak.idTokenParsed
      );
};
