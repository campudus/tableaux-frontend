/**
 * @tsImport
 * { "mode": "compile" }
 */

import fs from "fs/promises";
import { ServerResponse } from "http";
import modifyResponse from "node-http-proxy-json";
import { Either, left, right } from "pragmatic-fp-ts";
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

export const parsePermissionObject = (x: unknown): Either<PermissionObject> => {
  const result = permissionSchema.safeParse(x);
  return result.success ? right(result.data) : left(result.error as Error);
};
type PermissionObject = z.infer<typeof permissionSchema>;

const tableBaseRE = /\/tables\/\d+\/?$/;
const basePath: { [obj in keyof PermissionObject]: RegExp } = {
  columns: /tables\/\d+\/columns(\/\d+\/?)?$/,
  media: /media/,
  row: /\/tables\/.*\/rows(\d+\/?)?$/,
  service: /\/services\//,
  table: tableBaseRE,
  tableGroup: tableBaseRE,
  tables: /\/tables\/$/
} as const;

export const toSearchable = (
  permissions: PermissionObject
): Array<(_: string) => Record<string, boolean>> =>
  Object.entries(permissions).flatMap(([kind, ps]) => {
    const base: RegExp = basePath[kind];
    return Object.entries((ps as unknown) as Record<string, Function>).map(
      ([reTemplate, p]) => {
        const exact = new RegExp(reTemplate);
        return (path: string) => {
          const result = base.test(path) && exact.test(path) ? p : undefined;
          console.log({
            path,
            reTemplate,
            exactRe: exact,
            base: base.test(path),
            exact: exact.test(path),
            result
          });
          return result;
        };
      }
    );
  });

export const findInSearchable = (
  lookup: ReturnType<typeof toSearchable>,
  path: string
) =>
  lookup.reduce(
    (result, matches) => result || matches(path),
    undefined as ReturnType<typeof lookup[number]> | undefined
  );

export const injectPermissions = (permissions: PermissionObject) => {
  {
    const permAtPath = toSearchable(permissions);

    const injectPermissionsM = (req: Request) => (
      jsonBody?: Record<string, unknown>
    ) => {
      const permission = findInSearchable(permAtPath, req.url);
      if (permission && jsonBody && typeof jsonBody === "object") {
        jsonBody.permission = permission;
      }
      return jsonBody;
    };
    return (proxyRes: ServerResponse, req: Request, res: Response) =>
      modifyResponse(res, proxyRes, injectPermissionsM(req));
  }
};

export const loadPermissionConfig = (path: string): Either<PermissionObject> =>
  fs
    .readFile(path)
    .then(file => file.toString())
    .then(JSON.parse)
    .then(parsePermissionObject)
    .catch(err =>
      left(new Error(`Could not read permissions from ${path}: ${err.message}`))
    );
