import { useSelector } from "react-redux";
import Keycloak from "keycloak-js";
import React from "react";
import f from "lodash/fp";

import { config } from "../constants/TableauxConstants";
import { NO_AUTH_IN_DEV_MODE } from "../FeatureFlags";
import actions from "../redux/actionCreators";
import store from "../redux/store";

const keycloakInitOptions = {
  onLoad: "login-required",
  checkLoginIframe: false
};

// (state) => bool
// react-redux@7 selector
export const authSelector = f.propOr(false, ["grudStatus", "authenticated"]);

export const noAuthNeeded = f.memoize(
  () => process.env.NODE_ENV === "development" && NO_AUTH_IN_DEV_MODE
);

// () => Keycloak
// Side effects: Will login on first load and memoize the result
export const getLogin = f.memoize(
  noAuthNeeded()
    ? f.always({})
    : () => {
        const keycloakSettings = {
          realm: config.authRealm,
          url: "/auth",
          resource: "grud-frontend",
          clientId: "grud-frontend",
          "ssl-required": "external",
          "public-client": true,
          "confidential-port": 0
        };

        const keycloak = Keycloak(keycloakSettings);
        keycloak
          .init(keycloakInitOptions)
          .success(status => {
            store.dispatch(actions.setUserAuthenticated({ status }));
          })
          .error(err => {
            console.error("Error authenticating user:", err);
            store.dispatch(actions.setUserAuthenticated({ status: false }));
          });

        keycloak.onAuthLogout = () => {
          store.dispatch(actions.setUserAuthenticated({ status: false }));
        };

        keycloak.onTokenExpired = () => {
          keycloak.updateToken();
        };

        return keycloak;
      }
);

export const withUserAuthentication = noAuthNeeded()
  ? f.identity
  : Component => props => {
      const keycloakRef = React.useRef();
      const isLoggedIn = useSelector(authSelector);

      React.useEffect(() => {
        keycloakRef.current = getLogin();
      }, []);

      return isLoggedIn ? (
        <Component {...props} />
      ) : (
        <div className="auth-screen" />
      );
    };