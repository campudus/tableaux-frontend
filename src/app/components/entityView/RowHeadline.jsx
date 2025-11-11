import React from "react";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import { ColumnKinds } from "../../constants/TableauxConstants";
import { canUserSeeTable } from "../../helpers/accessManagementHelper";
import { getColumnDisplayName } from "../../helpers/multiLanguage";
import { openLinkOverlay } from "../cells/link/LinkOverlay";
import { openMarkdownEditor } from "../markdownEditor/MarkdownEditor";
import { openAttachmentOverlay } from "../cells/attachment/AttachmentOverlay";
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
        columnName={
          toTableVisible ? (
            <button
              className="title-wrapper"
              onClick={() => window.open(url, "_blank")}
            >
              {colName}

              <SvgIcon icon="tablelink" containerClasses="color-primary" />
            </button>
          ) : (
            <div className="title-wrapper">{colName}</div>
          )
        }
      >
        {thisUserCantEdit ? (
          <button
            className=" button--disabled neutral"
            ref={el => {
              funcs.register(el);
            }}
          >
            {i18n.t("table:edit_links", { title: colName })}
          </button>
        ) : (
          <button
            className="column-icon button"
            onClick={() => openLinkOverlay({ cell, langtag, actions })}
            ref={el => {
              funcs.register(el);
            }}
          >
            <SvgIcon icon="plus" containerClasses="color-white" />
            {i18n.t("table:edit_links", { title: colName })}
          </button>
        )}
      </BasicHeadline>
    );
  };

  openAttachmentOverlay = () => {
    const { cell, langtag } = this.props;
    openAttachmentOverlay({ langtag, cell });
  };

  mkAttachmentHeader = () => {
    const { funcs, thisUserCantEdit } = this.props;
    return (
      <BasicHeadline {...this.props}>
        {thisUserCantEdit ? (
          <button
            className="button neutral column-icon"
            ref={el => {
              funcs.register(el);
            }}
          >
            {i18n.t("table:edit_attachments")}
          </button>
        ) : (
          <button
            className="button column-icon"
            onClick={this.openAttachmentOverlay}
            ref={el => {
              funcs.register(el);
            }}
          >
            <SvgIcon icon="plus" containerClasses="color-white" />
            {i18n.t("table:edit_attachments")}
          </button>
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
      <button
        className="column-icon button"
        onClick={() =>
          openMarkdownEditor({
            cell: this.props.cell,
            langtag: this.props.langtag,
            readOnly: this.props.thisUserCantEdit
          })
        }
      >
        {i18n.t("table:open-markdown-editor")}
      </button>
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
