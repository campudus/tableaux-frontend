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
import SvgIcon from "../helperComponents/SvgIcon";

class RowHeadline extends React.Component {

  static propTypes = {
    column: React.PropTypes.object.isRequired,
    cell: React.PropTypes.object.isRequired,
    langtag: React.PropTypes.string.isRequired,
    setTranslationView: React.PropTypes.func.isRequired,
    funcs: React.PropTypes.object.isRequired,
    thisUserCantEdit: React.PropTypes.bool
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
    const {cell, langtag, funcs, thisUserCantEdit} = this.props;
    const url = `/${langtag}/tables/${column.toTable}`;
    const colName = this.getDisplayName(column);
    return (
      <div className="item-header">
        <div className="title-wrapper">
          <ItemPopupMenu langtag={this.props.langtag}
                         cell={this.props.cell}
                         setTranslationView={this.props.setTranslationView}
                         funcs={this.props.funcs}
          />
          <a href="#" onClick={() => window.open(url, "_blank")}>
            {colName}
            <SvgIcon icon="tablelink" containerClasses="color-primary"/>
          </a>
        </div>
        {(thisUserCantEdit)
          ? <a className="column-icon button neutral" href="#"
               ref={el => {
                 funcs.register(el)
               }}
          >
            {i18n.t("table:edit_links", {title: colName})}
          </a>
          : <a className="column-icon button" href="#"
               onClick={() => openLinkOverlay(cell, langtag)}
               ref={el => {
                 funcs.register(el)
               }}
          >
            <SvgIcon icon="plus" containerClasses="color-white" />
            {i18n.t("table:edit_links", {title: colName})}
          </a>
        }
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
    const {funcs, thisUserCantEdit} = this.props;
    return (
      <div className="item-header">
        <div className="title-wrapper">
          <ItemPopupMenu langtag={this.props.langtag}
                         cell={this.props.cell}
                         setTranslationView={this.props.setTranslationView}
                         funcs={this.props.funcs}
          />
          {this.getDisplayName(column)}
        </div>
        {(thisUserCantEdit)
          ? <a className="button neutral column-icon" href="#"
               ref={el => {
                 funcs.register(el)
               }}
          >
            {i18n.t("table:edit_attachments")}
          </a>
          : <a className="button column-icon" href="#"
               onClick={this.openAttachmentOverlay}
               ref={el => {
                 funcs.register(el)
               }}
          >
            <SvgIcon icon="plus" containerClasses="color-white" />
            {i18n.t("table:edit_attachments")}
          </a>
        }
      </div>
    )
  };

  mkDefaultHeader = column => (
    <div className="item-header">
      <div className="title-wrapper">
        <ItemPopupMenu langtag={this.props.langtag}
                       cell={this.props.cell}
                       setTranslationView={this.props.setTranslationView}
                       funcs={this.props.funcs || {}}
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
