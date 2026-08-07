import i18n from "i18next";
import f from "lodash/fp";
import React from "react";
import { batch, Provider, useSelector } from "react-redux";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";
import { bindActionCreators } from "redux";
import {
  DefaultLangtag,
  Langtags,
  ViewNames
} from "../constants/TableauxConstants";
import { withUserAuthentication } from "../helpers/authenticate";
import { unless } from "../helpers/functools";
import { useGrudInit } from "../helpers/useGrudInit";
import actionCreators from "../redux/actionCreators";
import store from "../redux/store";
import parseOptions from "../router/urlOptionParser";
import Spinner from "./header/Spinner";
import { PROFILE_TAB } from "./profile/constants";
import Tableaux from "./Tableaux";

const tablesSelector = state => state.tables;
const currentTableSelector = state => state.tableView.currentTable;
const currentLanguageSelector = state => state.tableView.currentLanguage;

const createRouteView = viewName => () => {
  const params = useParams();
  const location = useLocation();
  const tables = useSelector(tablesSelector);

  return renderComponent(params, location, tables, viewName);
};

const DashboardRouteView = createRouteView(ViewNames.DASHBOARD_VIEW);
const ProfileRouteView = createRouteView(ViewNames.PROFILE_VIEW);
const TaxonomyRouteView = createRouteView(ViewNames.TAXONOMY_DASHBOARD_VIEW);
const ServiceRouteView = createRouteView(ViewNames.FRONTEND_SERVICE_VIEW);

const TableRouteView = () => {
  const params = useParams();
  const location = useLocation();
  const tables = useSelector(tablesSelector);

  const validParams = validateRouteParams(params, tables);
  const { tableId, langtag, rowId } = validParams;
  const currentTable = currentTableSelector(store.getState());
  const currentLanguage = currentLanguageSelector(store.getState());
  const { filter } = parseOptions(location.search);

  // only load table if we're allowed to see at least one
  if ((!currentTable || tableId !== currentTable) && tableId) {
    batch(() => {
      store.dispatch(actionCreators.setCurrentTable(tableId));
      store.dispatch(actionCreators.cleanUp(tableId));
      store.dispatch(actionCreators.toggleCellSelection(validParams));
      store.dispatch(
        actionCreators.loadCompleteTable({ tableId, selectedRowId: rowId })
      );
      store.dispatch(actionCreators.applyUserSettings(tableId));
      store.dispatch(actionCreators.loadTableView(tableId, filter));
    });
  }

  if (tableId && tableId === currentTable && langtag === currentLanguage) {
    store.dispatch(actionCreators.applyUserSettings(tableId));
    store.dispatch(actionCreators.loadTableView(tableId));
  }

  if (langtag !== currentLanguage) {
    store.dispatch(actionCreators.setCurrentLanguage(langtag));
  }

  return renderComponent(params, location, tables, ViewNames.TABLE_VIEW);
};

const MediaRouteView = () => {
  const params = useParams();
  const location = useLocation();
  const tables = useSelector(tablesSelector);
  const { folderId, langtag } = validateRouteParams(params);
  store.dispatch(actionCreators.getMediaFolder(folderId, langtag));

  return renderComponent(params, location, tables, ViewNames.MEDIA_VIEW);
};

const PreviewRouteView = () => {
  const params = useParams();
  const location = useLocation();
  const tables = useSelector(tablesSelector);
  const { tableId, columnId, rowId } = validateRouteParams(params, tables);

  store.dispatch(actionCreators.loadPreviewView(tableId, rowId, columnId));

  return renderComponent(params, location, tables, ViewNames.PREVIEW_VIEW);
};

const GRUDRouter = React.memo(() => {
  const isInitialized = useGrudInit();
  const location = useLocation();
  const withLangtag = `/${DefaultLangtag}${location.pathname}`;

  return isInitialized ? (
    <Routes>
      <Route path="/:langtag/dashboard" element={<DashboardRouteView />} />
      <Route
        path="/dashboard"
        element={<Navigate to={withLangtag} replace />}
      />

      <Route
        path="/:langtag/profile/:profileTab"
        element={<ProfileRouteView />}
      />
      <Route path="/:langtag/profile" element={<ProfileRouteView />} />
      <Route
        path="/profile/*"
        element={<Navigate to={withLangtag} replace />}
      />
      <Route path="/profile" element={<Navigate to={withLangtag} replace />} />

      <Route path="/:langtag/taxonomies" element={<TaxonomyRouteView />} />
      <Route
        path="/taxonomies"
        element={<Navigate to={withLangtag} replace />}
      />

      <Route
        path="/:langtag/tables/:tableId/columns/:columnId/rows/:rowId"
        element={<TableRouteView />}
      />
      <Route
        path="/:langtag/tables/:tableId/columns/:columnId"
        element={<TableRouteView />}
      />
      <Route
        path="/:langtag/tables/:tableId/rows/:rowId"
        element={<TableRouteView />}
      />
      <Route path="/:langtag/tables/:tableId" element={<TableRouteView />} />
      <Route path="/:langtag/tables" element={<TableRouteView />} />
      <Route path="/tables/*" element={<Navigate to={withLangtag} replace />} />
      <Route path="/tables" element={<Navigate to={withLangtag} replace />} />

      <Route
        path="/:langtag/services/:serviceId/tables/:tableId/columns/:columnId/rows/:rowId"
        element={<ServiceRouteView />}
      />
      <Route
        path="/:langtag/services/:serviceId/tables/:tableId/columns/:columnId"
        element={<ServiceRouteView />}
      />
      <Route
        path="/:langtag/services/:serviceId/tables/:tableId/rows/:rowId"
        element={<ServiceRouteView />}
      />
      <Route
        path="/:langtag/services/:serviceId"
        element={<ServiceRouteView />}
      />
      <Route
        path="/services/*"
        element={<Navigate to={withLangtag} replace />}
      />

      <Route path="/:langtag/media/:folderId" element={<MediaRouteView />} />
      <Route path="/:langtag/media" element={<MediaRouteView />} />
      <Route path="/media/*" element={<Navigate to={withLangtag} replace />} />
      <Route path="/media" element={<Navigate to={withLangtag} replace />} />

      <Route
        path="/:langtag/preview/:tableId/rows/:rowId"
        element={<PreviewRouteView />}
      />
      <Route
        path="/:langtag/preview/:tableId/columns/:columnId/rows/:rowId"
        element={<PreviewRouteView />}
      />
      <Route
        path="/preview/*"
        element={<Navigate to={withLangtag} replace />}
      />
      <Route path="/preview" element={<Navigate to={withLangtag} replace />} />

      <Route
        path="*"
        element={<Navigate to={`/${DefaultLangtag}/dashboard`} replace />}
      />
    </Routes>
  ) : (
    <Spinner isLoading={true} />
  );
});

const renderComponent = (params, location, tables, viewName) => {
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

export const switchFolderHandler = (navigate, langtag, folderId) => {
  const url = folderId ? `/${langtag}/media/${folderId}` : `/${langtag}/media`;

  navigate(url);
};

// Changes UI- and content language
export const switchLanguageHandler = (navigate, pathname, langtag) => {
  i18n.changeLanguage(langtag);
  const newUrl = pathname.replace(/^\/.*?\//, `/${langtag}/`);
  navigate(newUrl);
};

// navigates to path
export const navigate = (navigateFn, path) => {
  navigateFn(path);
};

// react-router v6 dropped withRouter; this recreates the v5-shaped prop
// interface for the two remaining class components that relied on it.
export function withRouter(Component) {
  return function ComponentWithRouterProp(props) {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    return <Component {...props} router={{ location, navigate, params }} />;
  };
}

export default withUserAuthentication(props => (
  <Router>
    <GRUDRouter {...props} />
  </Router>
));
