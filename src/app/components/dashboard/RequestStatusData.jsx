import React from "react";
import { compose, lifecycle, pure, withStateHandlers } from "recompose";
import f from "lodash/fp";
import request from "superagent";
import { doto } from "../../helpers/functools";
import apiUrl from "../../helpers/apiUrl";
import Sentry from "@sentry/browser";

const FetchStatusData = ({ children, requestedData }) => (
  <React.Fragment>
    {React.cloneElement(children, { requestedData })}
  </React.Fragment>
);

const withApiData = compose(
  pure,
  withStateHandlers(f.always({ requestedData: undefined }), {
    setRequestedData: () => data => ({ requestedData: data })
  }),
  lifecycle({
    componentWillMount: async function() {
      const { setRequestedData } = this.props;
      const mergeTableTranslationStatus = allTranslations => table => {
        const translationForTable = doto(
          allTranslations,
          f.get("tables"),
          f.find(f.matchesProperty("id", table.id)),
          f.get("translationStatus")
        );
        return f.assoc("translationStatus", translationForTable, table);
      };

      const getJson = async url =>
        doto(await request.get(apiUrl(url)), f.get("text"), JSON.parse);

      try {
        const annotationCounts = await getJson("/tables/annotationCount");
        const translationStatus = await getJson("/tables/translationStatus");

        setRequestedData(
          doto(
            {},
            f.assoc("tables", f.get("tables", annotationCounts)),
            f.update(
              "tables",
              f.map(mergeTableTranslationStatus(translationStatus))
            ),
            f.assoc("translationStatus", translationStatus.translationStatus)
          )
        );
      } catch (err) {
        console.error(err);
        Sentry.captureException(err);
        setRequestedData({});
      }
    }
  })
);

export default withApiData(FetchStatusData);
