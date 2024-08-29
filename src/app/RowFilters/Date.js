import Number from "./Number";
import Text from "./Text";

/*
 * Note that all date comparisons except (not-)empty will only work with UTC-Z-format
 */

export default {
  ...Number,
  [Number.Mode.isEmpty]: Text[Text.Mode.isEmpty],
  [Number.Mode.isNotEmpty]: Text[Text.Mode.isNotEmpty]
};
