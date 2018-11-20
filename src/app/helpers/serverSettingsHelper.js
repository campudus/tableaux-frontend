import apiUrl from "./apiUrl";
import request from "superagent";

function requestEndHelper(errorMsg, onError, onOk) {
  return (error, result) => {
    if (error) {
      console.warn(errorMsg, error);
      onError(error);
    } else {
      onOk(result.body.value);
    }
  };
}

function requestSettingFromServer(key, onError, onOk) {
  return request.get(apiUrl(`/system/settings/${key}`))
    .end(requestEndHelper(`error fetching ${key} from server:`, onError, onOk));
}

export const getAllLangtagsFromServer = (onError, onOk) => requestSettingFromServer("langtags", onError, onOk);

export const getSentryUrlFromServer = (onError, onOk) => requestSettingFromServer("sentryUrl", onError, onOk);
