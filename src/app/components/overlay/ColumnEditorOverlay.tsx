import {
  ChangeEvent,
  FocusEvent,
  MouseEvent,
  ReactElement,
  useEffect,
  useState
} from "react";
import f from "lodash/fp";
import i18n from "i18next";
import Select, { ActionMeta, SelectOption } from "../GrudSelect";
import Header from "./Header";
import {
  Column,
  ColumnAttribute,
  ColumnAttributeMap,
  Table
} from "../../types/grud";
import { buildClassName as cn } from "../../helpers/buildClassName";

type ColumnData = Pick<Column, "displayName" | "description" | "attributes">;

type ColumnAttributeDef = {
  originalIndex?: number;
  key: string;
  type: ColumnAttribute["type"];
  value: ColumnAttribute["value"];
};

type ColumnAttributeTypeOption = {
  label: string;
  value: ColumnAttribute["type"];
};

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
  const columnAttributes = f
    .entries(column.attributes || {})
    .map(([key, attr], originalIndex) => ({ originalIndex, key, ...attr }));

  const [displayName, setDisplayName] = useState(column.displayName[langtag]);
  const [description, setDescription] = useState(column.description[langtag]);
  const [attributes, setAttributes] = useState<Partial<ColumnAttributeDef>[]>([
    ...columnAttributes,
    {}
  ]);

  const attributeTypeOptions: ColumnAttributeTypeOption[] = [
    { label: i18n.t("table:editor.attribute-string"), value: "string" },
    { label: i18n.t("table:editor.attribute-number"), value: "number" },
    { label: i18n.t("table:editor.attribute-boolean"), value: "boolean" }
  ];

  const getAttributeIdentifier = (index: number) => `attribute-${index}`;
  const getAttributeIndex = (identifier: string) => {
    return parseInt(identifier.replace("attribute-", ""));
  };
  const getAttributeTypeOption = (type?: ColumnAttribute["type"]) => {
    return f.find({ value: type }, attributeTypeOptions);
  };
  const isAttributeKeyUnique = (key?: string) => {
    return f.filter({ key }, attributes).length <= 1;
  };

  const handleUpdateDisplayName = (event: UpdateEvent<HTMLInputElement>) => {
    setDisplayName(event.target.value);
  };

  const handleUpdateDescription = (event: UpdateEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  const handleUpdateAttributeType = (
    option: ColumnAttributeTypeOption | null,
    actionMeta: ActionMeta<SelectOption>
  ) => {
    const attributeIndex = getAttributeIndex(actionMeta.name!);
    const attribute = attributes[attributeIndex];

    if (option) {
      const type = option.value;
      const value = type === "boolean" ? false : "";
      const newAttribute = { ...attribute, type, value };

      setAttributes(attributes.toSpliced(attributeIndex, 1, newAttribute));
    } else {
      setAttributes(attributes.toSpliced(attributeIndex, 1));
    }
  };

  const handleUpdateAttributeKey = (event: UpdateEvent<HTMLInputElement>) => {
    const attributeIndex = getAttributeIndex(event.target.name);
    const attribute = attributes[attributeIndex];
    const newAttribute = { ...attribute, key: event.target.value };

    setAttributes(attributes.toSpliced(attributeIndex, 1, newAttribute));
  };

  const handleUpdateAttributeValue = (event: UpdateEvent<HTMLInputElement>) => {
    const attributeIndex = getAttributeIndex(event.target.name);
    const attribute = attributes[attributeIndex];
    const value =
      attribute.type === "boolean"
        ? event.target.checked
        : attribute.type === "number"
        ? parseInt(event.target.value)
        : event.target.value;

    const newAttribute = { ...attribute, value };

    setAttributes(attributes.toSpliced(attributeIndex, 1, newAttribute));
  };

  const handleDeleteAttribute = (event: MouseEvent<HTMLButtonElement>) => {
    const attributeIndex = getAttributeIndex(event.currentTarget.name);
    const newAttributes = attributes.toSpliced(attributeIndex, 1);

    setAttributes(f.isEmpty(newAttributes) ? [{}] : newAttributes);
  };

  const handleAddAttribute = () => {
    setAttributes([...attributes, {}]);
  };

  useEffect(() => {
    if (updateSharedData) {
      updateSharedData(() => ({
        displayName: { ...column.displayName, [langtag]: displayName },
        description: { ...column.description, [langtag]: description },
        attributes: attributes.reduce((acc, def) => {
          const { originalIndex: index, key, type, value } = def;
          const original = !f.isNil(index) ? columnAttributes[index] : null;
          const isValidAttribute =
            !f.isEmpty(type) && !f.isNil(value) && value !== "";
          const isValidKey = !f.isEmpty(key) && f.isEmpty(acc[key]);

          if (isValidAttribute && isValidKey) {
            acc[key] = { type, value } as ColumnAttribute;
          } else if (!f.isEmpty(original)) {
            const { key, type, value } = original;
            acc[key] = { type, value } as ColumnAttribute;
          }

          return acc;
        }, {} as ColumnAttributeMap)
      }));
    }
  }, [displayName, description, attributes]);

  return (
    <div className="content-items column-editor">
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
      <div className="item">
        <div className="item-header">{i18n.t("table:editor.attributes")}</div>
        <div className="item-row item-row--header">
          <div className="item-header">
            {i18n.t("table:editor.attribute-type")}
          </div>
          <div className="item-header">
            {i18n.t("table:editor.attribute-key")}
          </div>
          <div className="item-header">
            {i18n.t("table:editor.attribute-value")}
          </div>
        </div>
        {attributes.map((attribute, index) => {
          const identifier = getAttributeIdentifier(index);
          const typeOption = getAttributeTypeOption(attribute.type);

          return (
            <div key={identifier} className="item-row">
              <div className="item-content">
                <Select
                  className="attribute-select"
                  isMulti={false}
                  name={identifier}
                  value={typeOption}
                  options={attributeTypeOptions}
                  onChange={handleUpdateAttributeType}
                  placeholder={i18n.t("table:editor.attribute-type-ph")}
                />
              </div>
              <div className="item-content">
                <input
                  className={cn("attribute-input", {
                    invalid: !isAttributeKeyUnique(attribute.key)
                  })}
                  type="text"
                  name={identifier}
                  placeholder={i18n.t("table:editor.attribute-key-ph")}
                  onChange={handleUpdateAttributeKey}
                  onBlur={handleUpdateAttributeKey}
                  value={attribute.key ? attribute.key : ""}
                />
              </div>
              <div className="item-content">
                {attribute && attribute.type && attribute.type === "boolean" && (
                  <label>
                    <input
                      className="attribute-input"
                      type="checkbox"
                      name={identifier}
                      onChange={handleUpdateAttributeValue}
                      onBlur={handleUpdateAttributeValue}
                      checked={
                        (attribute.value as boolean | undefined) || false
                      }
                    />

                    <span>{i18n.t("table:editor.attribute-current")}: </span>
                    <span className="bold">
                      {attribute.value
                        ? i18n.t("table:editor.attribute-yes")
                        : i18n.t("table:editor.attribute-no")}
                    </span>
                  </label>
                )}
                {attribute && attribute.type && attribute.type === "string" && (
                  <input
                    className="attribute-input"
                    type="text"
                    name={identifier}
                    placeholder={i18n.t("table:editor.attribute-value-ph")}
                    onChange={handleUpdateAttributeValue}
                    onBlur={handleUpdateAttributeValue}
                    value={(attribute.value as string | undefined) || ""}
                  />
                )}
                {attribute && attribute.type && attribute.type === "number" && (
                  <input
                    className="attribute-input"
                    type="number"
                    name={identifier}
                    placeholder={i18n.t("table:editor.attribute-value-ph")}
                    onChange={handleUpdateAttributeValue}
                    onBlur={handleUpdateAttributeValue}
                    value={(attribute.value as number | undefined) || ""}
                  />
                )}
              </div>
              <button
                className={cn("button", { delete: true })}
                name={identifier}
                onClick={handleDeleteAttribute}
              >
                <i className="fa fa-trash"></i>
              </button>
            </div>
          );
        })}

        <button
          className={cn("button", { add: true })}
          onClick={handleAddAttribute}
        >
          <i className="fa fa-plus"></i>
          <span>{i18n.t("table:editor.attribute-add")}</span>
        </button>
      </div>
    </div>
  );
}
