import App from "ampersand-app";

export const setUrlBarTo = url => {
  // App.router.navigate(url, { trigger: false });
};

export const setUrlBarToCell = ({ tableId, columnId, rowId, langtag }) => {
  setUrlBarTo(
    `/${langtag}/tables/${tableId}/columns/${columnId}/rows/${rowId}`
  );
};
