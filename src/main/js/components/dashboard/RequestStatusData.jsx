import React from "react";
import {compose, lifecycle, pure, withStateHandlers} from "recompose";
import f from "lodash/fp";
import request from "superagent";
import {doto} from "../../helpers/functools";
import apiUrl from "../../helpers/apiUrl";
import Raven from "raven-js";

const FetchStatusData = ({children, requestedData}) => (
  <React.Fragment>
    {
      React.cloneElement(children, {requestedData})
    }
  </React.Fragment>
);

const withApiData = compose(
  pure,
  withStateHandlers(
    f.always({requestedData: undefined}),
    {
      setRequestedData: () => (data) => ({requestedData: data})
    }
  ),
  lifecycle({
    componentWillMount: async function () {
      const {setRequestedData} = this.props;
      const mergeTableTranslationStatus = (allTranslations) => (table) => {
        const translationForTable = doto(allTranslations,
          f.get("tables"),
          f.find(f.matchesProperty("id", table.id)),
          f.get("needsTranslationStatus"),
        );
        return f.assoc("translationStatus", translationForTable, table);
      };
      try {
        const translationStatus = doto(await request.get(apiUrl("/tables/translationStatus")), f.get("text"), JSON.parse);
        const annotationCounts = doto(await request.get(apiUrl("/tables/annotationCount")), f.get("text"), JSON.parse);
        const requestedData = doto({},
          f.assoc("tables", f.get("tables", annotationCounts)),
          f.update("tables", f.map(mergeTableTranslationStatus(translationStatus))),
          f.assoc("translationStatus", translationStatus.translationStatus)
        );
        setRequestedData(requestedData);
      } catch (err) {
        console.error(err);
        Raven.captureException(err);
        setRequestedData({});
      }
    }
  })
);

export default withApiData(FetchStatusData);
