import f from "lodash/fp";
import { DependencyList, useEffect, useState } from "react";
import { makeRequest } from "./apiHelper";
import route from "./apiRoutes";
import { promisifyAction } from "../redux/redux-helpers";
import {
  initLangtags,
  initAnnotationConfigs
} from "../constants/TableauxConstants";
import actions from "../redux/actionCreators";
import store from "../redux/store";
import initUserSettings from "./initUserSettings";

export const useGrudInit = (retryOn: DependencyList = []) => {
  const [isInitialized, setInitialized] = useState(false);

  const init = async () => {
    try {
      const langtagsRoute = route.toSetting("langtags");
      const langtagsResponse = await makeRequest({ apiRoute: langtagsRoute });
      const langtags = langtagsResponse.value;

      initLangtags(langtags);

      const annotRoute = route.toAnnotationConfigs();
      const annotResponse = await makeRequest({ apiRoute: annotRoute });
      const annotationConfigs = annotResponse.annotations;

      initAnnotationConfigs(annotationConfigs);

      await promisifyAction(actions.loadTables)();
      await promisifyAction(actions.queryFrontendServices)();

      store.dispatch(actions.createDisplayValueWorker());

      setInitialized(true);

      // user settings are not a hard requirement for initialization
      const settingsResponse = await promisifyAction(actions.getUserSettings)();
      const settings = settingsResponse.settings;

      if (f.isEmpty(settings)) {
        await initUserSettings();
      }
    } catch (err) {
      console.error("Could not init GRUD!", err);
    }
  };

  useEffect(() => {
    void init();
  }, retryOn);

  return isInitialized;
};
