import i18n from "i18next";
import f from "lodash/fp";
import React from "react";
import { batch, Provider, useSelector } from "react-redux";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
  useHistory,
  useLocation
} from "react-router-dom";
import { CompatRoute, CompatRouter } from "react-router-dom-v5-compat";
import { bindActionCreators } from "redux";
import {
  DefaultLangtag,
  Langtags,
  ViewNames
} from "../constants/TableauxConstants";
import { withUserAuthentication } from "../helpers/authenticate";
import { unless } from "../helpers/functools";
import { initGrud } from "../initGrud";
import actionCreators from "../redux/actionCreators";
import store from "../redux/store";
import parseOptions from "../router/urlOptionParser";
import Spinner from "./header/Spinner";
import { PROFILE_TAB } from "./profile/constants";
import Tableaux from "./Tableaux";

const tablesSelector = state => state.tables;
const currentTableSelector = state => state.tableView.currentTable;
const currentFolderSelector = state => state.media.currentFolderId;
const currentLanguageSelector = state => state.tableView.currentLanguage;

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
  const history = useHistory();

  const renderTableView = React.useCallback(routeProps => {
    const validParams = validateRouteParams(routeProps.match.params, tables);
    const { tableId, langtag, rowId } = validParams;
    const currentTable = currentTableSelector(store.getState());
    const currentLanguage = currentLanguageSelector(store.getState());
    const { filter } = parseOptions(routeProps.location.search);

    // only load table if we're allowed to see at least one
    if ((!currentTable || tableId !== currentTable) && tableId) {
      batch(() => {
        switchTable(history, tableId);
        store.dispatch(actionCreators.cleanUp(tableId));
        store.dispatch(actionCreators.toggleCellSelection(validParams));
        store.dispatch(
          actionCreators.loadCompleteTable({ tableId, selectedRowId: rowId })
        );
        store.dispatch(actionCreators.loadTableView(tableId, filter));
      });
    }

    if (tableId && tableId === currentTable && langtag === currentLanguage) {
      store.dispatch(actionCreators.loadTableView(tableId));
    }

    if (langtag !== currentLanguage) {
      store.dispatch(actionCreators.setCurrentLanguage(langtag));
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

  const location = useLocation();
  const withLangtag = `/${DefaultLangtag}${location.pathname}`;

  return isInitialized ? (
    <CompatRouter>
      <Switch>
        <CompatRoute path="/:langtag/dashboard" render={renderDashboard} />
        <Route path="/dashboard" render={() => <Redirect to={withLangtag} />} />

        <CompatRoute
          path="/:langtag/profile/:profileTab"
          render={renderProfile}
        />
        <CompatRoute path="/:langtag/profile" render={renderProfile} />
        <Route path="/profile/*" render={() => <Redirect to={withLangtag} />} />
        <Route path="/profile" render={() => <Redirect to={withLangtag} />} />

        <CompatRoute
          path="/:langtag/taxonomies"
          render={renderTaxonomyDashboard}
        />
        <Route
          path="/taxonomies"
          render={() => <Redirect to={withLangtag} />}
        />

        <CompatRoute
          path="/:langtag/tables/:tableId/columns/:columnId/rows/:rowId"
          render={renderTableView}
        />
        <CompatRoute
          path="/:langtag/tables/:tableId/columns/:columnId"
          render={renderTableView}
        />
        <CompatRoute
          path="/:langtag/tables/:tableId/rows/:rowId"
          render={renderTableView}
        />
        <CompatRoute
          path="/:langtag/tables/:tableId"
          render={renderTableView}
        />
        <CompatRoute path="/:langtag/tables" render={renderTableView} />
        <Route path="/tables/*" render={() => <Redirect to={withLangtag} />} />
        <Route path="/tables" render={() => <Redirect to={withLangtag} />} />

        <CompatRoute
          path="/:langtag/services/:serviceId/tables/:tableId/columns/:columnId/rows/:rowId"
          render={renderServiceView}
        />
        <CompatRoute
          path="/:langtag/services/:serviceId/tables/:tableId/columns/:columnId"
          render={renderServiceView}
        />
        <CompatRoute
          path="/:langtag/services/:serviceId/tables/:tableId/rows/:rowId"
          render={renderServiceView}
        />
        <CompatRoute
          path="/:langtag/services/:serviceId"
          render={renderServiceView}
        />
        <Route
          path="/services/*"
          render={() => <Redirect to={withLangtag} />}
        />

        <CompatRoute
          path="/:langtag/media/:folderId"
          render={renderMediaView}
        />
        <CompatRoute path="/:langtag/media" render={renderMediaView} />
        <Route path="/media/*" render={() => <Redirect to={withLangtag} />} />
        <Route path="/media" render={() => <Redirect to={withLangtag} />} />

        <Route
          path="*"
          render={() => <Redirect to={`/${DefaultLangtag}/dashboard`} />}
        />
      </Switch>
    </CompatRouter>
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
    langtag: isValidLangtag(langtag) ? langtag : DefaultLangtag,
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
  const url = folderId ? `/${langtag}/media/${folderId}` : `/${langtag}/media`;

  history.push(url);
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

export default withUserAuthentication(props => (
  <Router>
    <GRUDRouter {...props} />
  </Router>
));
