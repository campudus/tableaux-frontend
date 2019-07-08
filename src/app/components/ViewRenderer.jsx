import React from "react";
import f from "lodash/fp";

import { ViewNames } from "../constants/TableauxConstants";
import DashboardView from "./dashboard/DashboardView";
import FrontendServiceView from "./frontendService/FrontendServiceView";
import MediaView from "../components/media/MediaView.jsx";
import TableView from "./tableView/TableView.jsx";
import reduxActionHoc from "../helpers/reduxActionHoc";

const viewNameIs = name => f.matchesProperty("viewName", name);

const renderTableView = props => {
  const { params } = props;
  return <TableView {...params} overlayOpen={!!props.overlayOpen} />;
};

const renderMediaView = ({ params }) => (
  <MediaView {...params} overlayOpen={!!params.overlayOpen} />
);

const renderDashboard = ({ params }) => <DashboardView {...params} />;

const renderFrontendService = ({ params }) => (
  <FrontendServiceView {...params} />
);

const ViewRenderer = f.cond([
  [viewNameIs(ViewNames.TABLE_VIEW), renderTableView],
  [viewNameIs(ViewNames.MEDIA_VIEW), renderMediaView],
  [viewNameIs(ViewNames.DASHBOARD_VIEW), renderDashboard],
  [viewNameIs(ViewNames.FRONTEND_SERVICE_VIEW), renderFrontendService]
]);

export default reduxActionHoc(ViewRenderer, () => {
  return {};
});
