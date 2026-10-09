import {
  FilterUserSetting,
  GlobalUserSetting,
  TableUserSetting,
  UserSetting,
  UserSettingKey,
  UserSettingKeyFilter,
  UserSettingKeyGlobal,
  UserSettingKeyTable,
  UserSettingKind,
  UserSettingValue
} from "./grud";

export type {
  FilterUserSetting,
  GlobalUserSetting,
  TableUserSetting,
  UserSetting,
  UserSettingKey,
  UserSettingKeyFilter,
  UserSettingKeyGlobal,
  UserSettingKeyTable,
  UserSettingKind,
  UserSettingValue
};

export type UserSettingParams<Kind extends UserSettingKind> =
  Kind extends "global"
    ? | (Pick<GlobalUserSetting, "kind"> & { key?: never }) // GET
      | Pick<GlobalUserSetting, "kind" | "key"> // PUT
    : Kind extends "table"
      ? | (Pick<TableUserSetting, "kind"> & { tableId?: never; key?: never }) // GET
        | (Pick<TableUserSetting, "kind" | "tableId"> & { key?: never }) // GET or DELETE
        | Pick<TableUserSetting, "kind" | "tableId" | "key"> // PUT or DELETE
      : Kind extends "filter"
        ? | (Pick<FilterUserSetting, "kind"> & { key?: never; id?: never }) // GET
          | (Pick<FilterUserSetting, "kind" | "key"> & { id?: never }) // PUT
          | (Pick<FilterUserSetting, "kind" | "id"> & { key?: never }) // DELETE
        : never;

export type UserSettingBody<
  Kind extends UserSettingKind,
  Key extends UserSettingKey
> = Kind extends "filter"
  ? { value: UserSettingValue<Key>; name: string }
  : { value: UserSettingValue<Key>; name?: never };
