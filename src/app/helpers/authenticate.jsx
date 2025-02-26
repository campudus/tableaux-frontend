import { useSelector } from "react-redux";
import Keycloak from "keycloak-js";
import React from "react";
import f from "lodash/fp";

import { config } from "../constants/TableauxConstants";
import actions from "../redux/actionCreators";
import store from "../redux/store";

const keycloakInitOptions = {
  onLoad: "login-required",
  checkLoginIframe: true
};

// (state) => bool
// react-redux@7 selector
export const authSelector = f.propOr(false, ["grudStatus", "authenticated"]);

export const noAuthNeeded = f.memoize(() => config.disableAuth);

// () => Keycloak
// Side effects: Will login on first load and memoize the result
export const getLogin = f.memoize(
  noAuthNeeded()
    ? f.always({})
    : () => {
        const keycloakSettings = {
          realm: config.authRealm,
          url: config.authServerUrl,
          resource: config.authClientId,
          clientId: config.authClientId,
          "ssl-required": "external",
          "public-client": true,
          "confidential-port": 0
        };

        const keycloak = new Keycloak(keycloakSettings);
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
      const keycloakRef = React.useRef(getLogin());
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
