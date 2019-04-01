import React from "react";
import { ColumnKinds } from "../../constants/TableauxConstants";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import * as f from "lodash/fp";
import Header from "../overlay/Header";
import AttachmentOverlay from "../cells/attachment/AttachmentOverlay";
import { openLinkOverlay } from "../cells/link/LinkOverlay";
import i18n from "i18next";
import ItemPopupMenu from "./ItemPopupMenu";
import SvgIcon from "../helperComponents/SvgIcon";
import PropTypes from "prop-types";
import store from "../../redux/store";

class RowHeadline extends React.Component {
  static propTypes = {
    column: PropTypes.object.isRequired,
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    setTranslationView: PropTypes.func.isRequired,
    funcs: PropTypes.object.isRequired,
    thisUserCantEdit: PropTypes.bool,
    popupOpen: PropTypes.bool.isRequired
  };

  getDisplayName = column => {
    const { langtag } = this.props;
    return (
      (column.displayName &&
        retrieveTranslation(langtag, column.displayName)) ||
      column.name
    );
  };

  getColumnIcon = column => {
    const columnIcons = {
      [ColumnKinds.text]: <i className="column-icon fa fa-paragraph" />,
      [ColumnKinds.richtext]: <i className="column-icon fa fa-paragraph" />,
      [ColumnKinds.shorttext]: <i className="column-icon fa fa-font" />,
      [ColumnKinds.link]: <i className="column-icon fa fa-link" />,
      [ColumnKinds.numeric]: <i className="column-icon fa fa-hashtag" />,
      [ColumnKinds.attachment]: <i className="column-icon fa fa-files" />,
      [ColumnKinds.boolean]: <i className="column-icon fa fa-check-square-o" />,
      [ColumnKinds.datetime]: <i className="column-icon fa fa-calendar" />,
      [ColumnKinds.date]: <i className="column-icon fa fa-calendar" />,
      [ColumnKinds.currency]: <i className="column-icon fa fa-money" />,
      [ColumnKinds.group]: (
        <SvgIcon
          icon="/img/icons/column-group.svg"
          containerClasses={"column-icon"}
        />
      )
    };
    return (
      columnIcons[column.kind] || <i className="column-icon fa fa-question" />
    );
  };

  mkLinkHeader = column => {
    const { actions, cell, langtag, funcs, thisUserCantEdit } = this.props;
    const url = `/${langtag}/tables/${column.toTable}`;
    const colName = this.getDisplayName(column);
    const toTableVisible = !f.prop(
      ["tables", "data", column.toTable, "hidden"],
      store.getState()
    );

    return (
      <div className="item-header">
        <div className="title-wrapper">
          <ItemPopupMenu
            langtag={this.props.langtag}
            cell={this.props.cell}
            setTranslationView={this.props.setTranslationView}
            funcs={this.props.funcs}
            popupOpen={this.props.popupOpen}
            thisUserCantEdit={thisUserCantEdit}
            hasMeaningfulLinks={this.props.hasMeaningfulLinks}
          />
          {toTableVisible ? (
            <a
              className="title-wrapper"
              href="#"
              onClick={() => window.open(url, "_blank")}
            >
              {colName}

              <SvgIcon icon="tablelink" containerClasses="color-primary" />
            </a>
          ) : (
            <div clasName="title-wrapper">{colName}</div>
          )}
        </div>
        {thisUserCantEdit ? (
          <a
            className="column-icon button neutral"
            href="#"
            ref={el => {
              funcs.register(el);
            }}
          >
            {i18n.t("table:edit_links", { title: colName })}
          </a>
        ) : (
          <a
            className="column-icon button"
            href="#"
            onClick={() => openLinkOverlay({ cell, langtag, actions })}
            ref={el => {
              funcs.register(el);
            }}
          >
            <SvgIcon icon="plus" containerClasses="color-white" />
            {i18n.t("table:edit_links", { title: colName })}
          </a>
        )}
      </div>
    );
  };

  openAttachmentOverlay = () => {
    const {
      actions,
      cell,
      cell: { table },
      langtag,
      value
    } = this.props;
    const tableName =
      retrieveTranslation(langtag, table.displayName) || table.name;
    actions.openOverlay({
      head: <Header langtag={langtag} context={tableName} />,
      body: <AttachmentOverlay cell={cell} langtag={langtag} value={value} />,
      title: cell,
      type: "full-height",
      preferRight: true
    });
  };

  mkAttachmentHeader = column => {
    const { funcs, thisUserCantEdit } = this.props;
    return (
      <div className="item-header">
        <div className="title-wrapper">
          <ItemPopupMenu
            langtag={this.props.langtag}
            cell={this.props.cell}
            setTranslationView={this.props.setTranslationView}
            funcs={this.props.funcs}
            popupOpen={this.props.popupOpen}
            thisUserCantEdit={thisUserCantEdit}
          />
          {this.getDisplayName(column)}
        </div>
        {thisUserCantEdit ? (
          <a
            className="button neutral column-icon"
            href="#"
            ref={el => {
              funcs.register(el);
            }}
          >
            {i18n.t("table:edit_attachments")}
          </a>
        ) : (
          <a
            className="button column-icon"
            href="#"
            onClick={this.openAttachmentOverlay}
            ref={el => {
              funcs.register(el);
            }}
          >
            <SvgIcon icon="plus" containerClasses="color-white" />
            {i18n.t("table:edit_attachments")}
          </a>
        )}
      </div>
    );
  };

  mkDefaultHeader = column => (
    <div className="item-header">
      <div className="title-wrapper">
        <ItemPopupMenu
          langtag={this.props.langtag}
          cell={this.props.cell}
          setTranslationView={this.props.setTranslationView}
          funcs={this.props.funcs}
          popupOpen={this.props.popupOpen}
          thisUserCantEdit={this.props.thisUserCantEdit}
        />
        {this.getDisplayName(column)}
      </div>
      {this.getColumnIcon(column)}
    </div>
  );

  render = () => {
    const { column } = this.props;
    return f.cond([
      [f.matchesProperty("kind", "link"), this.mkLinkHeader],
      [f.matchesProperty("kind", "attachment"), this.mkAttachmentHeader],
      [f.stubTrue, this.mkDefaultHeader]
    ])(column);
  };
}

export default RowHeadline;
