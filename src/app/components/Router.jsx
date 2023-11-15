import { Provider, useSelector, batch } from "react-redux";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { bindActionCreators } from "redux";
import React from "react";
import f from "lodash/fp";
import i18n from "i18next";

import { ViewNames, Langtags } from "../constants/TableauxConstants";
import { initGrud } from "../initGrud";
import { unless } from "../helpers/functools";
import { withUserAuthentication } from "../helpers/authenticate";
import Spinner from "./header/Spinner";
import Tableaux from "./Tableaux";
import actionCreators from "../redux/actionCreators";
import store from "../redux/store";
import parseOptions from "../router/urlOptionParser";
import { PROFILE_TAB } from "./profile/constants";

const tablesSelector = state => state.tables;
const currentTableSelector = state => state.tableView.currentTable;
const currentFolderSelector = state => state.media.currentFolderId;

const GRUDRouter = React.memo(() => {
  const [isInitialized, setInitSuccess] = React.useState(false);
  const tables = useSelector(tablesSelector);

  React.useEffect(() => {
    initGrud(setInitSuccess);
  }, []);

  const renderView = viewName => routeProps =>
    renderComponent(routerProps, routeProps, viewName);

  const renderDashboard = React.useCallback(
    renderView(ViewNames.DASHBOARD_VIEW)
  );

  const renderProfile = React.useCallback(renderView(ViewNames.PROFILE_VIEW));

  const renderTaxonomyDashboard = renderView(ViewNames.TAXONOMY_DASHBOARD_VIEW);

  const renderTableView = React.useCallback(routeProps => {
    const validParams = validateRouteParams(routeProps.match.params, tables);
    const { tableId } = validParams;
    const currentTable = currentTableSelector(store.getState());
    const { filter } = parseOptions(routeProps.location.search);

    // only load table if we're allowed to see at least one
    if ((!currentTable || tableId !== currentTable) && tableId) {
      batch(() => {
        switchTable(tableId);
        store.dispatch(actionCreators.cleanUp(tableId));
        store.dispatch(actionCreators.toggleCellSelection(validParams));
        store.dispatch(actionCreators.loadCompleteTable(tableId));
      });
    }

    if (tableId && tableId === currentTable) {
      store.dispatch(actionCreators.loadTableView(tableId, filter));
    }

    return renderView(ViewNames.TABLE_VIEW)(routeProps);
  });

  const renderServiceView = React.useCallback(
    renderView(ViewNames.FRONTEND_SERVICE_VIEW)
  );

  const renderMediaView = React.useCallback(routeProps => {
    const currentFolderId = currentFolderSelector(store.getState());
    const { folderId, langtag } = validateRouteParams(routeProps.match.params);

    // avoid infinite rerouting loop
    const folderToLoad = f.isNil(folderId) ? "root-folder" : folderId;
    if (folderToLoad !== currentFolderId) {
      store.dispatch(actionCreators.getMediaFolder(folderId, langtag));
    }

    return renderView(ViewNames.MEDIA_VIEW)(routeProps);
  });

  const routerProps = { langtags: Langtags, tables };

  return isInitialized ? (
    <Router>
      <Switch>
        <Route path="/:langtag?/dashboard" render={renderDashboard} />
        <Route path="/:langtag?/profile/:profileTab?" render={renderProfile} />
        <Route path="/:langtag?/taxonomies" render={renderTaxonomyDashboard} />
        <Route
          path="/:langtag?/(table|tables)/:tableId?/(columns)?/:columnId?/(rows)?/:rowId?"
          render={renderTableView}
        />
        <Route
          path="/:langtag?/(service|services)/:serviceId?/(table|tables)?/:tableId?/(columns)?/:columnId?/(rows)?/:rowId?"
          render={renderServiceView}
        />
        <Route path="/:langtag?/media/:folderId?" render={renderMediaView} />
        <Route path="/*" render={renderDashboard} />
      </Switch>
    </Router>
  ) : (
    <Spinner isLoading={true} />
  );
});

const renderComponent = (routerProps, routingResult, viewName) => {
  const {
    location,
    match: { params }
  } = routingResult;
  const { tables } = routerProps;
  const validParams = validateRouteParams(params, tables);
  const tableauxParams = {
    ...validParams,
    queryParams: getQueryParams(location.search)
  };
  const actions = bindActionCreators(actionCreators, store.dispatch);

  return (
    <Provider store={store}>
      <Tableaux
        initialViewName={viewName}
        initialParams={tableauxParams}
        actions={actions}
      />
    </Provider>
  );
};

const validateRouteParams = (routeParams, tables) => {
  const {
    langtag,
    tableId,
    columnId,
    rowId,
    folderId,
    serviceId,
    profileTab
  } = routeParams;
  const getFirstTableId = f.compose(
    f.prop("id"),
    f.first,
    f.values,
    f.prop("data")
  );
  return {
    langtag: isValidLangtag(langtag) ? langtag : f.first(Langtags),
    tableId: isValidTableId(tableId, tables)
      ? parseInt(tableId)
      : getFirstTableId(tables),
    columnId: validateNumber(columnId),
    rowId: validateNumber(rowId),
    folderId: validateNumber(folderId),
    serviceId: validateNumber(serviceId),
    profileTab: isValidProfileTab(profileTab) ? profileTab : null
  };
};

const getQueryParams = f.compose(
  f.mapValues(unless(arr => arr.length > 1, f.head)),
  f.mapValues(f.map(f.nth(1))),
  f.groupBy(f.first),
  f.map(f.split("=")),
  f.split("&"),
  f.replace(/^\?/, "")
);

const isValidLangtag = langtag =>
  /[a-z]{2}(-[A-Z]{2})?/.test() && f.contains(langtag, Langtags);

const isValidProfileTab = tabName => f.contains(tabName, f.values(PROFILE_TAB));

const isValidTableId = (tableId, tables) => {
  const findTableWithId = f.compose(
    f.find(f.propEq("id", parseInt(tableId))),
    f.prop("data")
  );
  return isNumeric(tableId) && findTableWithId(tables);
};

const isNumeric = str => /^\d+$/.test(str); // regex coerces nil values
const validateNumber = str => (isNumeric(str) ? parseInt(str) : undefined);

export const switchTable = ({ tableId } = {}) => {
  store.dispatch(actionCreators.setCurrentTable(tableId));
};

export const switchFolderHandler = (history, langtag, folderId) => {
  history.push(`/${langtag}/media/${folderId}`);
};

// Changes UI- and content language
export const switchLanguageHandler = (history, langtag) => {
  i18n.changeLanguage(langtag);
  const newUrl = history.location.pathname.replace(/^\/.*?\//, `/${langtag}/`);
  history.push(newUrl);
};

// navigates to path
export const navigate = (history, path) => {
  history.push(path);
};

export default withUserAuthentication(GRUDRouter);
