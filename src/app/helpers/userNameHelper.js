import { firstValidPropOr } from "./functools";
import { getLogin, noAuthNeeded } from "./authenticate";

export const getUserName = (onlyFirstName = false) => {
  const keycloak = getLogin();

  const fallbackUserName =
    import.meta.env.NODE_ENV === "production" ? "John Doe" : "GRUDling";
  return noAuthNeeded()
    ? fallbackUserName
    : firstValidPropOr(
        fallbackUserName,
        [onlyFirstName ? "given_name" : "name", "preferred_username"],
        keycloak.idTokenParsed
      );
};
