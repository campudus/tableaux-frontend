declare module "i18next" {
  export function init(options?: { [key: string]: any }): void;
  export function t(key: string, options?: { [key: string]: any }): string;
  export function changeLanguage(langtag: string): void;
}
