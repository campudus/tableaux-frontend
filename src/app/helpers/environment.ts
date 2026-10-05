import { config } from "../constants/TableauxConstants";

// Keep in sync with server/config.js
export type Environment = "production" | "staging" | "test";

type MarkedEnvironment = Exclude<Environment, "production">;

const DefaultColors: Record<MarkedEnvironment, string> = {
  test: "#c6e31e",
  staging: "#f97316"
};

const TitlePrefixes: Record<MarkedEnvironment, string> = {
  test: "[TEST]",
  staging: "[STAGING]"
};

// Anything but a known non-production value is production
export const getEnvironment = (value?: unknown): Environment =>
  value === "staging" || value === "test" ? value : "production";

export const getCurrentEnvironment = (): Environment =>
  getEnvironment(config?.grudEnvironment);

export const isMarked = (
  environment: Environment
): environment is MarkedEnvironment => environment !== "production";

export const prefixTitle = (
  title: string,
  environment: Environment = getCurrentEnvironment()
): string =>
  isMarked(environment) ? `${TitlePrefixes[environment]} ${title}` : title;

export const getBannerColor = (
  environment: MarkedEnvironment,
  configuredColor?: string,
  isValidColor: (color: string) => boolean = color =>
    CSS.supports("color", color)
): string =>
  configuredColor && isValidColor(configuredColor)
    ? configuredColor
    : DefaultColors[environment];

type RGB = [number, number, number];

// WCAG relative luminance, see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
const linearize = (channel: number): number => {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const getLuminance = ([r, g, b]: RGB): number =>
  0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);

export const getContrastTextColor = (background: RGB): "black" | "white" => {
  const luminance = getLuminance(background);
  const contrastWithBlack = (luminance + 0.05) / 0.05;
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  return contrastWithBlack >= contrastWithWhite ? "black" : "white";
};

// parseRgb : "rgb(1, 2, 3)" | "rgba(1, 2, 3, 0.5)" | "#010203" -> RGB
// Browsers compute colors to rgb(), test DOMs may keep the hex notation.
export const parseRgb = (computedColor: string): RGB | null => {
  const rgb = computedColor.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }
  const hex = computedColor.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  return hex
    ? [parseInt(hex[1]!, 16), parseInt(hex[2]!, 16), parseInt(hex[3]!, 16)]
    : null;
};

// Called once after the config is loaded, before anything is rendered
export const applyEnvironmentMarker = (
  environment: Environment = getCurrentEnvironment()
): void => {
  if (isMarked(environment)) {
    document.documentElement.classList.add("has-environment-marker");
    document.title = prefixTitle(document.title, environment);
  }
};
