// import f from "lodash/fp";
// import i18n from "i18next";
// import { useDispatch } from "react-redux";
// import { MouseEvent, ReactElement, useEffect, useRef, useState } from "react";
// import { useHistory } from "react-router-dom";
// import { List, AutoSizer } from "react-virtualized";

// import {
//   canUserCreateFiles,
//   canUserCreateFolders
// } from "../../../helpers/accessManagementHelper";
// import { Folder as FolderType } from "../../../types/grud";
// import { isAttachment } from "../../../types/guards";
// import Subfolder from "./Subfolder";
// import File from "./File";
// import Breadcrumbs from "../../helperComponents/Breadcrumbs";
// import SubfolderEdit from "./SubfolderEdit";
// import { createMediaFolder } from "../../../redux/actions/mediaActions";
// import { buildClassName as cn } from "../../../helpers/buildClassName";
// import { switchFolderHandler } from "../../Router";
// import SvgIcon from "../../helperComponents/SvgIcon";
// import { outsideClickEffect } from "../../../helpers/useOutsideClick";

// const LAYOUT = {
//   LIST: "list",
//   TILES: "tiles"
// } as const;

// type Layout = typeof LAYOUT[keyof typeof LAYOUT];

// type FolderProps = {
//   langtag: string;
//   folder: Partial<FolderType>;
//   fileIdsDiff: string[];
// };

// export default function Folder({
//   langtag,
//   folder,
//   fileIdsDiff
// }: FolderProps): ReactElement {
//   const layoutMenuRef = useRef<HTMLUListElement>(null);
//   const history = useHistory();
//   const dispatch = useDispatch();
//   const [layout, setLayout] = useState<Layout>(LAYOUT.LIST);
//   const [showLayoutMenu, setShowLayoutMenu] = useState(false);
//   const [isNewFolder, setIsNewFolder] = useState(false);
//   const { id, parents, subfolders = [], files } = folder;
//   const isRoot = folder.id === null;
//   const sortedFiles = f.orderBy(f.prop("updatedAt"), "desc", files);
//   const breadcrumbsFolders = f.concat(parents ?? [], !isRoot ? [folder] : []);
//   const newFolderName = i18n.t("media:new_folder");
//   const dirents = [...subfolders, ...sortedFiles];

//   const handleNavigateToParent = (event: MouseEvent<HTMLButtonElement>) => {
//     switchFolderHandler(history, langtag, folder?.parentId);
//     event.preventDefault();
//   };

//   const handleToggleNewFolder = () => {
//     setIsNewFolder(isNew => !isNew);
//   };

//   const handleSaveNewFolder = (name: string) => {
//     if (name !== "" && name !== newFolderName) {
//       dispatch(createMediaFolder({ parentId: id, name, description: "" }));
//     }
//     handleToggleNewFolder();
//   };

//   const handleToggleLayoutMenu = () => {
//     setShowLayoutMenu(isOpen => !isOpen);
//   };

//   const handleCloseLayoutMenu = () => {
//     setShowLayoutMenu(false);
//   };

//   const handleSelectLayout = (layout: Layout) => {
//     setLayout(layout);
//     setShowLayoutMenu(false);
//   };

//   useEffect(
//     outsideClickEffect({
//       shouldListen: showLayoutMenu,
//       containerRef: layoutMenuRef,
//       onOutsideClick: handleCloseLayoutMenu
//     }),
//     [showLayoutMenu, layoutMenuRef.current]
//   );

//   return (
//     <div className="folder">
//       <div className="folder__toolbar">
//         <Breadcrumbs
//           className="folder__breadcrumbs"
//           links={[
//             {
//               path: `/${langtag}/media`,
//               label: i18n.t("media:root_folder_name")
//             },
//             ...breadcrumbsFolders.map(({ id, name }) => ({
//               path: `/${langtag}/media/${id}`,
//               label: (
//                 <>
//                   <i className="fa fa-folder-open" />
//                   <span>{name ?? `Folder ${id}`}</span>
//                 </>
//               )
//             }))
//           ]}
//         />

//         <div className="folder__actions">
//           <button
//             className={cn("folder__action", { secondary: true, menu: true })}
//             onClick={handleToggleLayoutMenu}
//           >
//             <SvgIcon
//               containerClasses={cn("folder__action-menu-icon", {
//                 selected: showLayoutMenu
//               })}
//               icon={layout}
//             />

//             {showLayoutMenu && (
//               <ul className="folder__action-menu" ref={layoutMenuRef}>
//                 <li
//                   className="folder__action-menu-item"
//                   onClick={e => {
//                     handleSelectLayout(LAYOUT.LIST);
//                     e.stopPropagation();
//                   }}
//                 >
//                   <SvgIcon
//                     containerClasses="folder__action-menu-icon"
//                     icon={LAYOUT.LIST}
//                   />
//                   {i18n.t("media:layout_list")}
//                 </li>
//                 <li
//                   className="folder__action-menu-item"
//                   onClick={e => {
//                     handleSelectLayout(LAYOUT.TILES);
//                     e.stopPropagation();
//                   }}
//                 >
//                   <SvgIcon
//                     containerClasses="folder__action-menu-icon"
//                     icon={LAYOUT.TILES}
//                   />
//                   {i18n.t("media:layout_tiles")}
//                 </li>
//               </ul>
//             )}
//           </button>

//           {canUserCreateFolders() && (
//             <button
//               className={cn("folder__action", { secondary: true })}
//               onClick={handleToggleNewFolder}
//             >
//               <i className="icon fa fa-plus" />
//               <span>{i18n.t("media:new_folder")}</span>
//             </button>
//           )}

//           {canUserCreateFiles() && (
//             <button
//               className={cn("folder__action", { primary: true })}
//               onClick={handleClickUpload}
//             >
//               <i className="icon fa fa-upload" />
//               <span>{i18n.t("media:upload_file")}</span>
//             </button>
//           )}
//         </div>
//       </div>

//       <div className="folder__list">
//         {!isRoot && (
//           <div className="folder__list-item">
//             <button className="nav__link" onClick={handleNavigateToParent}>
//               <i className="icon fa fa-folder" />
//               <span>{".."}</span>
//             </button>
//           </div>
//         )}
//         {isNewFolder && (
//           <div className="folder__list-item">
//             <SubfolderEdit
//               name={i18n.t("media:new_folder")}
//               onClose={handleToggleNewFolder}
//               onSave={handleSaveNewFolder}
//             />
//           </div>
//         )}
//         <AutoSizer>
//           {({ height, width }) => (
//             <List
//               height={height}
//               width={width}
//               rowCount={dirents.length}
//               overscanRowCount={10}
//               rowHeight={56}
//               rowRenderer={({ index, style }) => {
//                 const dirent = dirents[index]!;
//                 const isFile = isAttachment(dirent);
//                 const isMod = isFile && f.contains(dirent.uuid, fileIdsDiff);

//                 return (
//                   <div
//                     key={isFile ? dirent?.uuid : dirent?.id}
//                     style={style}
//                     className={cn("folder__list-item", {
//                       modified: isMod
//                     })}
//                   >
//                     {isFile ? (
//                       <File langtag={langtag} file={dirent} />
//                     ) : (
//                       <Subfolder langtag={langtag} folder={dirent} />
//                     )}
//                   </div>
//                 );
//               }}
//             />
//           )}
//         </AutoSizer>
//       </div>
//     </div>
//   );
// }
