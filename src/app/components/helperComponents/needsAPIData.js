import {
  branch,
  compose,
  lifecycle,
  renderNothing,
  withStateHandlers
} from "recompose";
import f from "lodash/fp";
import Request from "superagent";
import withAbortableXhrRequests from "./withAbortableXhrRequests";

export default compose(
  withAbortableXhrRequests,
  withStateHandlers(() => ({ requestedData: undefined }), {
    setRequestData: (
      state,
      { requestUrl, addAbortableXhrRequest }
    ) => response => ({
      requestedData: f.flow(
        f.get("text"),
        JSON.parse
      )(response)
    })
  }),
  lifecycle({
    componentWillMount() {
      const { addAbortableXhrRequest, requestUrl } = this.props;
      console.log("needsAPIData: getting", requestUrl);
      const req = Request.get(requestUrl).end((error, response) => {
        if (error) {
          console.error(error);
        } else {
          this.props.setRequestData(response);
        }
      });
      addAbortableXhrRequest(req);
    }
  }),
  branch(props => f.isEmpty(props.requestUrl), renderNothing)
);
