import React from "react";
import f from "lodash/fp";
import localStore from "localforage";
import * as rx from "rxjs";

import { either, ifElse } from "./functools";

export const safetyPrefix = "for(;;);";
export const matchSafetyPrefix = /^for\(;;\);/;

localStore.config({ name: "Campudus", storeName: "GRUD" });

export const toWriteable = raw =>
  raw
    ? f.identity
    : value => {
        const str = JSON.stringify(value);
        return safetyPrefix + str; // avoid cross-site attacks
      };

export const readValue = raw =>
  raw
    ? f.identity
    : value =>
        either(value)
          .exec("replace", matchSafetyPrefix, "")
          .map(JSON.parse)
          .getOrElse(null);

const streams = {};
const registerStream = (key, raw, initialValue) => {
  const subject = new rx.BehaviorSubject();
  streams[key] = subject;
  localStore
    .getItem(key)
    .then(ifElse(f.isNil, () => initialValue, readValue(raw)))
    .then(x => {
      try {
        subject.next(x);
      } catch {
        // pass
      }
    })
    .then(() => {
      subject.subscribe(value => {
        localStore.setItem(key, toWriteable(raw)(value));
      });
    })
    .catch(console.error);

  return subject;
};

export const useLocalStorage = (key, initialValue = null, raw = false) => {
  streams[key] = streams[key] || registerStream(key, raw, initialValue);
  const stream = streams[key];
  const [value, setValue] = React.useState(null);

  React.useEffect(() => {
    const id = stream.subscribe(setValue);
    return () => {
      stream.unsubscribe(id);
      if (stream && !stream.observers) {
        streams[key] = null;
      }
    };
  }, [setValue]);

  return [value, x => stream.next(x)];
};

export const withLocalStorage = ({
  key,
  initialValue,
  raw
}) => Component => props => {
  const [value, setValue] = useLocalStorage(key, initialValue, raw);
  const storage = { ...(props.storage || {}), [key]: { value, setValue } };
  return <Component storage={storage} {...props} />;
};
