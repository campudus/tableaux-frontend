export type TablesPermission = {
  create?: boolean;
};

export type TablePermission = {
  createColumn?: boolean;
  createRow?: boolean;
  delete?: boolean;
  editCellAnnotation?: boolean;
  editDisplayProperty?: boolean;
  editRowAnnotatin?: boolean;
  editStructureProperty?: boolean;
};

export type ColumnPermission = {
  delete?: boolean;
  editCellValue?: boolean | Record<string, boolean>;
  editDisplayProperty?: boolean;
  editStructureProperty?: boolean;
};

export type RowPermission = Record<string, boolean>; // Not defined in HackMD

export type MediaPermission = {
  createMedia?: boolean;
  deleteMedia?: boolean;
  editMedia?: boolean;
};

export type ServicePermission = {
  delete?: boolean;
  editDisplayProperty?: boolean;
  editStructureProperty?: boolean;
};

export type TableGroupPermission = {
  createTableGroup?: boolean;
  deleteTableGroup?: boolean;
  editTableGroup?: boolean;
};
