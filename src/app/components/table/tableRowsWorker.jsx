import actions from "../../redux/actionCreators";
import store from "../../redux/store";

export function duplicateRow(payload) {
  return new Promise((resolve, reject) => {
    store.dispatch(
      actions.duplicateRow({
        ...payload,
        onSuccess: resolve,
        onError: reject
      })
    );
  });
}
