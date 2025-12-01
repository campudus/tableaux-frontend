import React from "react";
import f from "lodash/fp";

import { ViewNames } from "../constants/TableauxConstants";
import DashboardView from "./dashboard/DashboardView";
import FrontendServiceView from "./frontendService/FrontendServiceView";
import MediaView from "../components/media/MediaView";
import PreviewView from "../components/preview/PreviewView";
import TableView from "./tableView/TableView.jsx";
import reduxActionHoc from "../helpers/reduxActionHoc";
import TaxonomyDashboard from "./taxonomy/TaxonomyDashboard";
import ProfileView from "./profile/ProfileView";

const viewNameIs = name => f.matchesProperty("viewName", name);

const renderTableView = props => {
  const { params } = props;
  return <TableView {...params} overlayOpen={!!props.overlayOpen} />;
};

const renderMediaView = ({ params }) => (
  <MediaView {...params} overlayOpen={!!params.overlayOpen} />
);

const renderPreviewView = ({ params }) => (
  <PreviewView {...params} overlayOpen={!!params.overlayOpen} />
);

const renderDashboard = ({ params }) => <DashboardView {...params} />;

const renderFrontendService = ({ params }) => (
  <FrontendServiceView {...params} />
);

const renderTaxonomyDashboard = props => (
  <TaxonomyDashboard {...props.params} history={history} />
);

const renderProfile = ({ params }) => <ProfileView {...params} />;

const ViewRenderer = f.cond([
  [viewNameIs(ViewNames.TABLE_VIEW), renderTableView],
  [viewNameIs(ViewNames.MEDIA_VIEW), renderMediaView],
  [viewNameIs(ViewNames.PREVIEW_VIEW), renderPreviewView],
  [viewNameIs(ViewNames.DASHBOARD_VIEW), renderDashboard],
  [viewNameIs(ViewNames.FRONTEND_SERVICE_VIEW), renderFrontendService],
  [viewNameIs(ViewNames.TAXONOMY_DASHBOARD_VIEW), renderTaxonomyDashboard],
  [viewNameIs(ViewNames.PROFILE_VIEW), renderProfile]
]);

export default reduxActionHoc(ViewRenderer, () => {
  return {};
});
