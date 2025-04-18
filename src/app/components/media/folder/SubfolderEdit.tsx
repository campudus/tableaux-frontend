import {
  ChangeEvent,
  KeyboardEvent,
  ReactElement,
  useEffect,
  useRef,
  useState
} from "react";
import { outsideClickEffect } from "../../../helpers/useOutsideClick";

type SubfolderEditProps = {
  name: string;
  onClose: () => void;
  onSave: (name: string) => void;
};

export default function SubfolderEdit({
  name: folderName,
  onClose,
  onSave
}: SubfolderEditProps): ReactElement {
  const editRef = useRef(null);
  const [name, setName] = useState(folderName);

  const handleChangeName = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleKeydown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSave(name);
    } else if (event.key === "Tab") {
      event.preventDefault();
      onSave(name);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  useEffect(
    outsideClickEffect({
      shouldListen: true,
      containerRef: editRef,
      onOutsideClick: onClose
    }),
    [editRef.current]
  );

  return (
    <div ref={editRef} className="subfolder-edit">
      <i className="icon fa fa-folder" />
      <input
        autoFocus
        type="text"
        value={name}
        onChange={handleChangeName}
        onKeyDown={handleKeydown}
      />
    </div>
  );
}
