import "../node_modules/react-select/dist/react-select.css";
import "./app/router/router";
import Sentry from "@sentry/browser";
import { makeRequest } from "./app/helpers/apiHelper";
import route from "./app/helpers/apiRoutes";
import { getUserName } from "./app/helpers/userNameHelper";

async function initSentry(noDryRun = true) {
  const username = getUserName();
  const dsn = (await makeRequest({ apiRoute: route.toSetting("sentryUrl") }))
    .value;
  if (noDryRun) {
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

console.log("Campudus GRUD frontend", process.env.BUILD_ID);
initSentry(process.env.NODE_ENV === "production");
