import React from "react";
import {ViewNames} from "../constants/TableauxConstants";
import f from "lodash/fp";
import TableView from "./tableView/TableView.jsx";
// import MediaView from "../components/media/MediaView.jsx";
import DashboardView from "./dashboard/DashboardView";
import {pure} from "recompose";

const viewNameIs = (name) => f.matchesProperty("viewName", name);

const renderTableView = ({params}) => {console.log(params);return(
  <TableView {...params}
             overlayOpen={!!params.overlayOpen}
  />
)};

const renderMediaView = ({params}) => (
  <div />
  // <MediaView {...params}
  //            overlayOpen={!!params.overlayOpen}
  // />
);

const renderDashboard = ({params}) => (
  <DashboardView {...params} />
);

const ViewRenderer = f.cond([
  [viewNameIs(ViewNames.TABLE_VIEW), renderTableView],
  [viewNameIs(ViewNames.MEDIA_VIEW), renderMediaView],
  [viewNameIs(ViewNames.DASHBOARD_VIEW), renderDashboard]
]);

export default pure(ViewRenderer);
