import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseDir = path.join(__dirname, "..");
const outDir = path.join(baseDir, "out");

const configDefaults = {
  enableHistory: true,
  showTableDropdown: true,
  outDir: outDir,
  apiHost: "localhost",
  apiPort: 8080,
  host: "0.0.0.0",
  port: "3000"
};

const loadConfig = configPath => {
  let config;

  try {
    console.error("Config file path", configPath);
    const configJson = fs.readFileSync(configPath, "utf-8");
    config = JSON.parse(configJson);
  } catch (err) {
    console.error("Warning: Could not read config file, using defaults");
  }

  for (const envParam of [
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
    "disableAuth"
  ]) {
    const envNameSnake = envParam.replace(/([A-Z])/g, "_$1").toUpperCase();
    const envNameUpper = envParam.toUpperCase();
    const envValue = process.env[envNameSnake] || process.env[envNameUpper];

    if (envValue) {
      console.error("Overriding", envParam, "with", envValue, "from env");

      try {
        config[envParam] = JSON.parse(envValue); // extract bools and numbers
      } catch (err) {
        config[envParam] = envValue;
      }
    }
  }

  return { ...configDefaults, ...config };
};

export default loadConfig;
