import * as f from "lodash/fp";
import {FallbackLanguage} from "../../../constants/TableauxConstants";
import Empty from "../../helperComponents/emptyEntry";

const getLinkLabel = (collection, langtag) => {
  const getCellString = langtag => cell => (cell.isMultiLanguage)
    ? f.defaultTo(cell.value[FallbackLanguage])(cell.value[langtag])
    : cell.value;
  const value = f.join(" ")(f.map(getCellString(langtag), collection));
  return (f.isEmpty(value))
    ? <Empty />
    : value;
};

export default getLinkLabel;
