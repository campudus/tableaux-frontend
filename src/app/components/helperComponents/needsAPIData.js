import { branch, compose, renderNothing } from 'recompose';
import React from 'react';
import f from "lodash/fp";

import { makeRequest } from '../../helpers/apiHelper';

const needsApiData = Component => props => {
  const { requestUrl } = props;
  const [requestedData, setRequestedData] = React.useState();

  React.useEffect(() => {
    makeRequest({ url: requestUrl }).then(setRequestedData);
  }, []);

  return <Component {...props} requestedData={requestedData} />;
};

export default compose(
  branch(props => f.isEmpty(props.requestUrl), renderNothing),
  needsApiData
);
