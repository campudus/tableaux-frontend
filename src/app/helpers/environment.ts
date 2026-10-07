import { config } from "../constants/TableauxConstants";

// Keep in sync with server/config.js
export type Environment = "production" | "staging" | "test";

type MarkedEnvironment = Exclude<Environment, "production">;

export type BannerColors = { background: string; text: string };

const DefaultColors: Record<MarkedEnvironment, BannerColors> = {
  test: { background: "#c6e31e", text: "#000000" },
  staging: { background: "#f97316", text: "#000000" }
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

// Each configured color falls back to the environment's default on its own
export const getBannerColors = (
  environment: MarkedEnvironment,
  configured: Partial<BannerColors>,
  isValidColor: (color: string) => boolean = color =>
    CSS.supports("color", color)
): BannerColors => {
  const pick = (key: keyof BannerColors) => {
    const color = configured[key];
    return color && isValidColor(color)
      ? color
      : DefaultColors[environment][key];
  };
  return { background: pick("background"), text: pick("text") };
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
