import React from "react";
import { ViewNames } from "../constants/TableauxConstants";
import f from "lodash/fp";
import TableView from "./tableView/TableView.jsx";
// import MediaView from "../components/media/MediaView.jsx";
import DashboardView from "./dashboard/DashboardView";
import { pure } from "recompose";
import reduxActionHoc from "../helpers/reduxActionHoc";

const viewNameIs = name => f.matchesProperty("viewName", name);

const renderTableView = props => {
  const { params } = props;
  return <TableView {...params} overlayOpen={!!props.overlayOpen} />;
};

const renderMediaView = ({ params }) => (
  <div />
  // <MediaView {...params}
  //            overlayOpen={!!params.overlayOpen}
  // />
);

const renderDashboard = ({ params }) => <DashboardView {...params} />;

const ViewRenderer = f.cond([
  [viewNameIs(ViewNames.TABLE_VIEW), renderTableView],
  [viewNameIs(ViewNames.MEDIA_VIEW), renderMediaView],
  [viewNameIs(ViewNames.DASHBOARD_VIEW), renderDashboard]
]);

export default reduxActionHoc(ViewRenderer, () => {
  return {};
});
