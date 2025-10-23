import fs from "fs/promises";
import modifyResponse from "node-http-proxy-json";
import { left, right } from "pragmatic-fp-ts";
import z from "zod";

const optionalBoolean = z.boolean().optional();
const parseTablesPermission = z
  .object({
    create: optionalBoolean
  })
  .strict();
const parseTablePermission = z
  .object({
    createColumn: optionalBoolean,
    createRow: optionalBoolean,
    delete: optionalBoolean,
    editCellAnnotation: optionalBoolean,
    editDisplayProperty: optionalBoolean,
    editRowAnnotatin: optionalBoolean,
    editStructureProperty: optionalBoolean
  })
  .strict();
const parseColumnPermission = z
  .object({
    delete: optionalBoolean,
    editCellValue: z.optional(
      z.boolean().or(z.record(z.string(), z.boolean()))
    ),
    editDisplayProperty: optionalBoolean,
    editStructureProperty: optionalBoolean
  })
  .strict();
const parseRowPermission = z.record(z.string(), z.boolean());
const parseMediaPermission = z
  .object({
    createMedia: optionalBoolean,
    deleteMedia: optionalBoolean,
    editMedia: optionalBoolean
  })
  .strict();
const parseServicePermssion = z
  .object({
    delete: optionalBoolean,
    editDisplayProperty: optionalBoolean,
    editStructureProperty: optionalBoolean
  })
  .strict();
const parseTableGroupPermission = z
  .object({
    createTableGroup: optionalBoolean,
    deleteTableGroup: optionalBoolean,
    editTableGroup: optionalBoolean
  })
  .strict();

const permissionSchema = z
  .object({
    columns: z.record(z.string(), parseColumnPermission).optional(),
    media: z.record(z.string(), parseMediaPermission).optional(),
    row: z.record(z.string(), parseRowPermission).optional(),
    service: z.record(z.string(), parseServicePermssion).optional(),
    table: z.record(z.string(), parseTablePermission).optional(),
    tableGroup: z.record(z.string(), parseTableGroupPermission).optional(),
    tables: z.record(z.string(), parseTablesPermission).optional()
  })
  .strict();

export const parsePermissionObject = x => {
  const result = permissionSchema.safeParse(x);
  return result.success ? right(result.data) : left(result.error);
};

const tableBaseRE = /\/tables\/\d+\/?$/;
const basePath = {
  columns: /tables\/\d+\/columns(\/\d+\/?)?$/,
  media: /media/,
  row: /\/tables\/.*\/rows(\d+\/?)?$/,
  service: /\/services\//,
  table: tableBaseRE,
  tableGroup: tableBaseRE,
  tables: /\/tables\/?$/
};

export const toSearchable = permissions =>
  Object.entries(permissions).flatMap(([kind, ps]) => {
    const base = basePath[kind];
    return Object.entries(ps).map(([reTemplate, p]) => {
      const exact = new RegExp(reTemplate);
      return path => (base.test(path) && exact.test(path) ? p : undefined);
    });
  });

export const findInSearchable = (lookup, path) =>
  lookup.reduce((result, matches) => result || matches(path), undefined);

export const injectPermissions = permissions => {
  {
    const permAtPath = toSearchable(permissions);

    const injectIndividualTablePermissionsM = jsonBody => {
      jsonBody.tables?.forEach(table => {
        const permission = findInSearchable(permAtPath, `/tables/${table.id}`);
        if (permission) table.permission = permission;
      });
    };

    const injectIndividualColumnPermissionsM = (jsonBody, baseUrl) => {
      jsonBody.columns?.forEach(column => {
        const pathToColumn = `${baseUrl}/${column.id}`;
        const permission = findInSearchable(permAtPath, pathToColumn);
        if (permission) column.permission = permission;
      });
    };

    const injectPermissionsM = req => jsonBody => {
      const pathToColumnsOfTable = /\/tables\/\d+\/columns\/?$/;
      if (pathToColumnsOfTable.test(req.url)) {
        injectIndividualColumnPermissionsM(
          jsonBody,
          req.url.replace(/\/+$/, "")
        );
      }
      if (basePath.tables.test(req.url)) {
        injectIndividualTablePermissionsM(jsonBody);
      }
      const permission = findInSearchable(permAtPath, req.url);
      if (permission && jsonBody && typeof jsonBody === "object") {
        jsonBody.permission = permission;
      }
      return jsonBody;
    };
    return (proxyRes, req, res) =>
      modifyResponse(res, proxyRes, injectPermissionsM(req));
  }
};

export const loadPermissionConfig = path =>
  fs
    .readFile(path)
    .then(file => file.toString())
    .then(JSON.parse)
    .then(parsePermissionObject)
    .catch(err =>
      left(new Error(`Could not read permissions from ${path}: ${err.message}`))
    );
