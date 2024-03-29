import React from "react";

const FolderList = props => {
  const { folder, navigateFolder } = props;

  return (
    <div className="folder-list-wrapper">
      <ul className="folder-list">
        {folder.subfolders.map(subfolder => {
          return (
            <li
              className=""
              key={subfolder.id}
              onClick={() => navigateFolder(subfolder.id)}
            >
              <button>
                <i className="icon fa fa-folder-open" /> {subfolder.name}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default FolderList;
