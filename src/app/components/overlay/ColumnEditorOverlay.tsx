import i18n from "i18next";
import {
  ChangeEvent,
  FocusEvent,
  ReactElement,
  useEffect,
  useState
} from "react";
import Header from "./Header";
import { Column, Table } from "../../types/grud";

type ColumnData = Pick<Column, "displayName" | "description">;

type ColumnEditorOverlayProps = {
  langtag: string;
  column: Column;
  table: Table;
  // provided through hoc
  sharedData?: ColumnData;
  updateSharedData?: (updateFn: (data?: ColumnData) => ColumnData) => void;
  actions?: {
    editColumn: (columnId: number, tableId: number, data: ColumnData) => void;
  };
};

type ColumnEditorOverlayHeaderProps = ColumnEditorOverlayProps;
type ColumnEditorOverlayBodyProps = Omit<ColumnEditorOverlayProps, "table">;
type UpdateEvent<T> = ChangeEvent<T> | FocusEvent<T>;

export function ColumnEditorOverlayHeader(
  props: ColumnEditorOverlayHeaderProps
): ReactElement {
  const { langtag, sharedData, actions, column, table } = props;

  const handleUpdateColumn = () => {
    if (sharedData && actions) {
      actions.editColumn(column.id, table.id, sharedData);
    }
  };

  return (
    <Header
      {...props}
      context={i18n.t("table:editor.edit_column")}
      title={column.displayName[langtag] || column.name}
      buttonActions={{
        positive: [i18n.t("common:save"), handleUpdateColumn],
        neutral: [i18n.t("common:cancel"), null]
      }}
    />
  );
}

export function ColumnEditorOverlayBody({
  langtag,
  column,
  updateSharedData
}: ColumnEditorOverlayBodyProps): ReactElement {
  const [displayName, setDisplayName] = useState(column.displayName[langtag]);
  const [description, setDescription] = useState(column.description[langtag]);

  const handleUpdateDisplayName = (event: UpdateEvent<HTMLInputElement>) => {
    setDisplayName(event.target.value);
  };

  const handleUpdateDescription = (event: UpdateEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  useEffect(() => {
    if (updateSharedData) {
      updateSharedData(() => ({
        displayName: { ...column.displayName, [langtag]: displayName },
        description: { ...column.description, [langtag]: description }
      }));
    }
  }, [displayName, description]);

  return (
    <div className="content-items">
      <div className="item">
        <div className="item-header">{i18n.t("table:editor.colname")}</div>
        <div className="item-description">
          ({i18n.t("table:editor.sanity_info")})
        </div>
        <input
          type="text"
          autoFocus
          className="item-content"
          onChange={handleUpdateDisplayName}
          onBlur={handleUpdateDisplayName}
          value={displayName}
        />
      </div>
      <div className="item">
        <div className="item-header">{i18n.t("table:editor.description")}</div>
        <textarea
          className="item-content"
          rows={6}
          onChange={handleUpdateDescription}
          onBlur={handleUpdateDescription}
          value={description}
        />
      </div>
    </div>
  );
}
