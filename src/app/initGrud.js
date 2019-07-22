/**
 * Perform actions that must happen before routing or are required
 * in all views, like retrieving Sentry URL, or fetching all available
 * langtags
 */

import * as Sentry from "@sentry/browser";

import { getUserName } from "./helpers/userNameHelper";
import { initDevelopmentAccessCookies } from "./helpers/accessManagementHelper";
import { makeRequest } from "./helpers/apiHelper";
import { promisifyAction } from "./redux/redux-helpers";
import { watchServerConnection } from "./helpers/connectionWatcher";
import TableauxConstants from "./constants/TableauxConstants";
import actions from "./redux/actionCreators";
import route from "./helpers/apiRoutes";
import store from "./redux/store";

export const initGrud = async setSuccess => {
  try {
    const loadServices = promisifyAction(actions.queryFrontendServices)();
    const initLangtags = makeRequest({
      apiRoute: route.toSetting("langtags")
    }).then(response => TableauxConstants.initLangtags(response.value));
    const loadTables = promisifyAction(actions.loadTables)();
    const maybeInitSentry = initSentry(process.env.NODE_ENV === "production");

    store.dispatch(actions.createDisplayValueWorker());
    initDevelopmentAccessCookies(); // TODO: Replace that with real auth

    await Promise.all([
      loadServices,
      initLangtags,
      loadTables,
      maybeInitSentry
    ]);

    watchServerConnection();
    setSuccess(true);
    return true;
  } catch (err) {
    console.error("Could not init GRUD!", err);
    return setSuccess(false);
  }
};

async function initSentry(isProduction = true) {
  const username = getUserName();
  const dsn = (await makeRequest({ apiRoute: route.toSetting("sentryUrl") }))
    .value;
  if (isProduction) {
    Sentry.init({
      dsn,
      release: process.env.BUILD_ID
    });
    Sentry.configureScope(scope => scope.setUser({ username }));
    Sentry.captureMessage("Sentry initialised");
  } else {
    console.log("Project Sentry url:", dsn);
  }
}
