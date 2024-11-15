/**
 * Perform actions that must happen before routing or are required
 * in all views, like retrieving Sentry URL, or fetching all available
 * langtags
 */

import { makeRequest } from "./helpers/apiHelper";
import { promisifyAction } from "./redux/redux-helpers";
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

    store.dispatch(actions.loadGlobalSettings());
    store.dispatch(actions.createDisplayValueWorker());

    await Promise.all([loadServices, initLangtags, loadTables]);
    setSuccess(true);
    return true;
  } catch (err) {
    console.error("Could not init GRUD!", err);
    return setSuccess(false);
  }
};
