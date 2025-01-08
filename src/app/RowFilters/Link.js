import Text from "./Text";
import f from "lodash/fp";

export default {
  Mode: Text.Mode,
  [Text.Mode.contains]: query => {
    const matches = Text[Text.Mode.contains](query);
    return values => values?.some(matches);
  },
  [Text.Mode.endsWith]: query => {
    const matches = Text[Text.Mode.endsWith](query);
    return values => values?.some(matches);
  },
  [Text.Mode.equals]: query => {
    const matches = Text[Text.Mode.equals](query);
    return values => values?.some(matches);
  },
  [Text.Mode.isEmpty]: () => f.every(f.isEmpty),
  [Text.Mode.isNotEmpty]: () => f.some(f.complement(f.isEmpty)),
  [Text.Mode.startsWith]: query => {
    const matches = Text[Text.Mode.startsWith](query);
    return values => values?.some(matches);
  },
  readValue: Text.readValue
};
