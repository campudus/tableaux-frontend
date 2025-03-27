import i18n from "i18next";
import { ChangeEvent, FocusEvent, ReactElement } from "react";
import { Column } from "../../types/grud";

export type ColumnDetails = Pick<Column, "displayName" | "description">;

type ColumnEditorOverlayProps = {
  langtag: string;
  details: ColumnDetails;
  handleUpdate: (details: ColumnDetails) => void;
};

type UpdateEvent<T> = ChangeEvent<T> | FocusEvent<T>;

export default function ColumnEditorOverlay({
  langtag,
  details,
  handleUpdate
}: ColumnEditorOverlayProps): ReactElement {
  const handleUpdateDisplayName = (event: UpdateEvent<HTMLInputElement>) => {
    handleUpdate({
      ...details,
      displayName: { ...details.displayName, [langtag]: event.target.value }
    });
  };

  const handleUpdateDescription = (event: UpdateEvent<HTMLTextAreaElement>) => {
    handleUpdate({
      ...details,
      description: { ...details.description, [langtag]: event.target.value }
    });
  };

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
          value={details.displayName[langtag]}
        />
      </div>
      <div className="item">
        <div className="item-header">{i18n.t("table:editor.description")}</div>
        <textarea
          className="item-content"
          rows={6}
          onChange={handleUpdateDescription}
          onBlur={handleUpdateDescription}
          value={details.description[langtag]}
        />
      </div>
    </div>
  );
}
