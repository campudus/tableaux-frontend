import React from "react";
import {ColumnKinds, FallbackLanguage} from "../../constants/TableauxConstants";
import {getLanguageOfLangtag} from "../../helpers/multiLanguage";

class RowHeadline extends React.Component {

  static propTypes = {
    column: React.PropTypes.object,
    langtag: React.PropTypes.string.isRequired
  };

  render = () => {
    const {column, langtag} = this.props;

    const language = getLanguageOfLangtag(langtag);
    const columnDisplayName = column.displayName[langtag] || column.displayName[language];
    const fallbackColumnDisplayName = column.displayName[FallbackLanguage] || column.name;
    let columnName = typeof columnDisplayName === "undefined" ? fallbackColumnDisplayName : columnDisplayName;

    let columnIcon;
    switch (column.kind) {
      case ColumnKinds.shorttext:
      case ColumnKinds.text:
      case ColumnKinds.richtext:
        columnIcon = <i key="column-icon" className="fa fa-font" />;
        break;
      case ColumnKinds.link:
        columnIcon = <i key="column-icon" className="fa fa-link" />;
        columnName = <a target="_blank" href={`/${langtag}/tables/${column.toTable}`}>{columnName}
          <i className="fa fa-external-link" /></a>;
        break;
      case ColumnKinds.numeric:
        columnIcon = <i key="column-icon" className="fa fa-hashtag" />;
        break;
      case ColumnKinds.attachment:
        columnIcon = <i key="column-icon" className="fa fa-files-o" />;
        break;
      case ColumnKinds.boolean:
        columnIcon = <i key="column-icon" className="fa fa-check-square-o" />;
        break;
      case ColumnKinds.datetime:
        columnIcon = <i key="column-icon" className="fa fa-calendar" />;
        break;
      case ColumnKinds.currency:
        columnIcon = <i key="column-icon" className="fa fa-money" />;
        break;
    }

    if (!React.isValidElement(columnName)) {
      columnName = <span>{columnName}</span>;
    }

    return (
      <div className="row-headline">{columnIcon}{columnName}</div>
    );
  }
}

export default RowHeadline;
