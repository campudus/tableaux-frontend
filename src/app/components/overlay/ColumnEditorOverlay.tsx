import { ChangeEvent, FocusEvent, ReactElement, useState } from "react";
import i18n from "i18next";

type Input = {
  displayValue: string;
  description: string;
};

type SetInputState = (value: string) => void;
type InputElement = HTMLInputElement | HTMLTextAreaElement;
type InputEvent = ChangeEvent<InputElement> | FocusEvent<InputElement>;

type ColumnEditorOverlayProps = {
  columnName: string;
  description: string;
  handleInput: (input: Input) => void;
};

export default function ColumnEditorOverlay({
  handleInput,
  ...props
}: ColumnEditorOverlayProps): ReactElement {
  const [columnName, setName] = useState(props.columnName);
  const [description, setDescription] = useState(props.description);

  const setDomElValue = (setState: SetInputState) => (event: InputEvent) => {
    setState(event.target.value);
    handleInput({ displayValue: columnName, description });
  };

  const handleNameChange = setDomElValue(setName);
  const handleDescriptionChange = setDomElValue(setDescription);

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
          onChange={handleNameChange}
          onBlur={handleNameChange}
          value={columnName}
        />
      </div>
      <div className="item">
        <div className="item-header">{i18n.t("table:editor.description")}</div>
        <textarea
          className="item-content"
          rows={6}
          onChange={handleDescriptionChange}
          onBlur={handleDescriptionChange}
          value={description}
        />
      </div>
    </div>
  );
}
