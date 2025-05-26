import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseDir = path.join(__dirname, "..");
const outDir = path.join(baseDir, "out");

const envParams = [
  "outDir",
  "apiHost",
  "apiPort",
  "host",
  "port",
  "webhookUrl",
  "authClientId",
  "authServerUrl",
  "authRealm",
  "enableHistory",
  "showTableDropdown",
  "disableAuth",
  "injectPermissions"
];

const configDefault = {
  enableHistory: true,
  showTableDropdown: true,
  outDir: outDir,
  apiHost: "localhost",
  apiPort: 8080,
  host: "0.0.0.0",
  port: "3000"
};

const loadConfig = configPath => {
  let configLocal;

  try {
    console.error("Config file path", configPath);
    const configJson = fs.readFileSync(configPath, "utf-8");
    configLocal = JSON.parse(configJson);
  } catch (err) {
    console.error("Warning: Could not read config file, using defaults");
  }

  const configEnv = envParams.reduce((config, param) => {
    const envNameSnake = param.replace(/([A-Z])/g, "_$1").toUpperCase();
    const envNameUpper = param.toUpperCase();
    const envValue = process.env[envNameSnake] || process.env[envNameUpper];

    if (envValue) {
      console.error("Overriding", param, "with", envValue, "from env");
      try {
        config[param] = JSON.parse(envValue);
      } catch {
        config[param] = envValue;
      }
    }

    return config;
  }, {});

  return { ...configDefault, ...configLocal, ...configEnv };
};

export default loadConfig;
