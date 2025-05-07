import React from "react";
import f from "lodash/fp";

import { makeRequest } from "../../helpers/apiHelper";
import { mapP, usePropAsKey } from "../../helpers/functools";

const routeToTranslation = "/tables/translationStatus";
const routeToAnnotations = "/tables/annotationCount";

//--- Higher Order Component ---
const withDashboardStatusData = Component => props => {
  const [dashboardStatus, setDashboardStatus] = React.useState();

  // equivalent to "componentDidMount"
  React.useEffect(() => {
    buildDashboardStatus().then(setDashboardStatus);
  }, []);

  return <Component {...props} requestedData={dashboardStatus} />;
};

//--- Local helper functions ---

const buildDashboardStatus = async () => {
  // send both requests in parallel
  const [rawAnnotationCounts, rawTranslationStates] = await mapP(
    makeGetRequestFromRoute
  )([routeToAnnotations, routeToTranslation]);

  return {
    tables: mergeCounts(rawAnnotationCounts, rawTranslationStates),
    translationStatus: extractTotalTranslationStatus(rawTranslationStates)
  };
};

const makeGetRequestFromRoute = apiRoute => makeRequest({ apiRoute });

const mergeCounts = (rawAnnotationCounts, rawTranslationStates) => {
  const annotationCounts = extractTableProp(rawAnnotationCounts);
  const translationLookupMap = buildIdLookupMap(rawTranslationStates);

  return annotationCounts.map(table => ({
    ...table,
    translationStatus: f.prop(
      "translationStatus",
      translationLookupMap[table.id]
    )
  }));
};

const extractTableProp = f.prop("tables");

const extractTotalTranslationStatus = f.prop("translationStatus");

const buildIdLookupMap = f.compose(usePropAsKey("id"), extractTableProp);

export default withDashboardStatusData;
