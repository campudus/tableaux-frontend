export default function thunkMiddleware() {
  return ({ dispatch, getState }) => next => action => {
    if (typeof action === "function") {
      return action(dispatch, getState);
    }

    const { promise, actionTypes, ...rest } = action;

    if (!actionTypes || !promise) {
      return next(action);
    }

    const [request, success, failure] = actionTypes;

    next({
      ...rest,
      type: request
    });

    const onSuccess = result => {
      // This is meant to resolve something wrapped in a promise, not to do fancy stuff with the state
      action.onSuccess && action.onSuccess(result);
      return next({
        type: success,
        result: result,
        ...rest
      });
    };

    const onFailure = error => {
      // This is meant to reject something wrapped in a promise, not to do fancy stuff with the state
      action.onError && action.onError(error);
      next({
        type: failure,
        error: error,
        ...rest
      });
    };

    const onError = error => {
      console.error("thunk middleware error:", error);

      return onFailure(error);
    };

    return promise.then(onSuccess, onFailure).catch(onError);
  };
}
