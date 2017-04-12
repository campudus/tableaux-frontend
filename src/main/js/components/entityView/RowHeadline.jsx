import React from "react";
import {ColumnKinds, FallbackLanguage} from "../../constants/TableauxConstants";
import {getLanguageOfLangtag} from "../../helpers/multiLanguage";
import * as f from "lodash/fp";
import ActionCreator from "../../actions/ActionCreator";
import OverlayHeadRowIdentificator from "../overlay/OverlayHeadRowIdentificator";
import Header from "../overlay/Header";
import AttachmentOverlay from "../cells/attachment/AttachmentOverlay";
import {openLinkOverlay} from "../cells/link/LinkOverlay";
import i18n from "i18next";
import ItemPopupMenu from "./ItemPopupMenu";

class RowHeadline extends React.Component {

  static propTypes = {
    column: React.PropTypes.object.isRequired,
    cell: React.PropTypes.object.isRequired,
    langtag: React.PropTypes.string.isRequired,
    setTranslationView: React.PropTypes.func.isRequired
  };

  getDisplayName = column => {
    const {langtag} = this.props;
    const language = getLanguageOfLangtag(langtag);
    return column.displayName[langtag]
      || column.displayName[language]
      || column.displayName[FallbackLanguage];
  };

  getColumnIcon = column => {
    const columnIcons = {
      [ColumnKinds.text]: "align-left",
      [ColumnKinds.richtext]: "align-left",
      [ColumnKinds.shorttext]: "font",
      [ColumnKinds.link]: "link",
      [ColumnKinds.numeric]: "hashtag",
      [ColumnKinds.attachment]: "files",
      [ColumnKinds.boolean]: "check-square-o",
      [ColumnKinds.datetime]: "calendar",
      [ColumnKinds.date]: "calendar",
      [ColumnKinds.currency]: "money",
    };
    return <i className={`column-icon fa fa-${columnIcons[column.kind] || "question"}`} />;
  };

  mkLinkHeader = column => {
    const {cell, langtag} = this.props;
    const url = `/${langtag}/tables/${column.toTable}`;
    return (
      <div className="item-header">
        <div className="title-wrapper">
          <ItemPopupMenu langtag={this.props.langtag}
                         cell={this.props.cell}
                         setTranslationView={this.props.setTranslationView}
          />
          <a href="#" onClick={() => window.open(url, "_blank")}>
            {this.getDisplayName(column)}
            <i className="fa fa-external-link" />
          </a>
        </div>
        <a className="column-icon button" href="#" onClick={() => openLinkOverlay(cell, langtag)}>
          {i18n.t("table:edit_links")}
        </a>
      </div>
    )
  };

  openAttachmentOverlay = () => {
    const {cell, langtag} = this.props;
    const table = cell.tables.get(cell.tableId);
    const tableName = table.displayName[langtag] || table.displayName[FallbackLanguage];
    ActionCreator.openOverlay({
      head: <Header context={tableName} title={<OverlayHeadRowIdentificator cell={cell} langtag={langtag} />} />,
      body: <AttachmentOverlay cell={cell} langtag={langtag} />,
      type: "full-height"
    });
  };

  mkAttachmentHeader = column => {
    const {langtag, cell} = this.props;
    const url = `/${langtag}/tables/${cell.toTable}`;
    return (
      <div className="item-header">
        <div className="title-wrapper">
          <ItemPopupMenu langtag={this.props.langtag}
                         cell={this.props.cell}
                         setTranslationView={this.props.setTranslationView}
          />
          {this.getDisplayName(column)}
        </div>
        <a className="button column-icon" href="#" onClick={this.openAttachmentOverlay}>
          {i18n.t("table:edit_attachments")}
        </a>
      </div>
    )
  };

  mkDefaultHeader = column => (
    <div className="item-header">
      <div className="title-wrapper">
        <ItemPopupMenu langtag={this.props.langtag}
                       cell={this.props.cell}
                       setTranslationView={this.props.setTranslationView}
        />
        {this.getDisplayName(column)}
      </div>
      {this.getColumnIcon(column)}
    </div>
  );

  render = () => {
    const {column} = this.props;
    return f.cond([
      [f.matchesProperty("kind", "link"), this.mkLinkHeader],
      [f.matchesProperty("kind", "attachment"), this.mkAttachmentHeader],
      [f.stubTrue, this.mkDefaultHeader]
    ])(column);
  }
}

export default RowHeadline;
