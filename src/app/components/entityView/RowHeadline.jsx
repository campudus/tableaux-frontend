import React from "react";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import { ColumnKinds } from "../../constants/TableauxConstants";
import { canUserSeeTable } from "../../helpers/accessManagementHelper";
import {
  getColumnDisplayName,
  getTableDisplayName
} from "../../helpers/multiLanguage";
import { openLinkOverlay } from "../cells/link/LinkOverlay";
import { openMarkdownEditor } from "../markdownEditor/MarkdownEditor";
import AttachmentOverlay from "../cells/attachment/AttachmentOverlay";
import Header from "../overlay/Header";
import ItemPopupMenu from "./ItemPopupMenu";
import SvgIcon from "../helperComponents/SvgIcon";

const BasicHeadline = props => (
  <div className="item-header">
    <div className="title-wrapper">
      <ItemPopupMenu {...f.omit(["children", "columnName"], props)} />
      {props.columnName ||
        getColumnDisplayName(props.cell.column, props.langtag)}
    </div>
    {props.children}
  </div>
);

class RowHeadline extends React.Component {
  getColumnIcon = column => {
    const columnIcons = {
      [ColumnKinds.text]: <i className="column-icon fa fa-paragraph" />,
      [ColumnKinds.richtext]: <i className="column-icon fa fa-edit" />,
      [ColumnKinds.shorttext]: <i className="column-icon fa fa-font" />,
      [ColumnKinds.link]: <i className="column-icon fa fa-link" />,
      [ColumnKinds.numeric]: <i className="column-icon fa fa-hashtag" />,
      [ColumnKinds.attachment]: <i className="column-icon fa fa-files" />,
      [ColumnKinds.boolean]: <i className="column-icon fa fa-check-square-o" />,
      [ColumnKinds.datetime]: <i className="column-icon fa fa-calendar" />,
      [ColumnKinds.date]: <i className="column-icon fa fa-calendar" />,
      [ColumnKinds.currency]: <i className="column-icon fa fa-money" />,
      [ColumnKinds.status]: <div />,
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
    const colName = getColumnDisplayName(column, langtag);
    const toTableVisible = canUserSeeTable(column.toTable);

    return (
      <BasicHeadline
        {...this.props}
        columName={
          toTableVisible ? (
            <a
              className="title-wrapper"
              href="#"
              onClick={() => window.open(url, "_blank")}
            >
              {colName}

              <SvgIcon icon="tablelink" containerClasses="color-primary" />
            </a>
          ) : (
            <div className="title-wrapper">{colName}</div>
          )
        }
      >
        {thisUserCantEdit ? (
          <a
            className=" button--disabled neutral"
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
      </BasicHeadline>
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
    const tableName = getTableDisplayName(table, langtag);
    actions.openOverlay({
      head: <Header langtag={langtag} context={tableName} />,
      body: <AttachmentOverlay cell={cell} langtag={langtag} value={value} />,
      title: cell,
      type: "full-height",
      preferRight: true
    });
  };

  mkAttachmentHeader = () => {
    const { funcs, thisUserCantEdit } = this.props;
    return (
      <BasicHeadline {...this.props}>
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
      </BasicHeadline>
    );
  };

  mkDefaultHeader = () => (
    <BasicHeadline {...this.props}>
      {this.getColumnIcon(this.props.cell.column)}
    </BasicHeadline>
  );

  mkRichtextHeader = () => (
    <BasicHeadline {...this.props}>
      <a
        className="column-icon button"
        href=""
        onClick={() =>
          openMarkdownEditor({
            cell: this.props.cell,
            langtag: this.props.langtag,
            readOnly: this.props.thisUserCantEdit
          })
        }
      >
        {i18n.t("table:open-markdown-editor")}
      </a>
    </BasicHeadline>
  );

  render = () => {
    const { column } = this.props;
    return f.cond([
      [f.matchesProperty("kind", "link"), this.mkLinkHeader],
      [f.matchesProperty("kind", "attachment"), this.mkAttachmentHeader],
      [f.matchesProperty("kind", "richtext"), this.mkRichtextHeader],
      [f.stubTrue, this.mkDefaultHeader]
    ])(column);
  };
}

export default RowHeadline;

RowHeadline.propTypes = {
  column: PropTypes.object.isRequired,
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  setTranslationView: PropTypes.func.isRequired,
  funcs: PropTypes.object.isRequired,
  thisUserCantEdit: PropTypes.bool,
  popupOpen: PropTypes.bool.isRequired
};
