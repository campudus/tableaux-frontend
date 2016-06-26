import apiUrl from './apiUrl';
import request from 'superagent';

export function getAllLangtagsFromServer(onError, onOk) {
  request.get(apiUrl("/system/settings/langtags"))
    .end((error, result) => {
        if (error) {
          console.warn("error fetching langtags from server:", error);
          onError(error);
        } else {
          onOk(result.body.value);
        }
      }
    );
}

