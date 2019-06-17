const path = require("path");

// These config params can be overwritten by env params
const envParams = [
  "outDir",
  "apiHost",
  "apiPort",
  "host",
  "port",
  "webhookUrl"
];

// These config params will be passed on to the build artefact
const appParams = ["webhookUrl"];

const enrichConfig = config => {
  try {
    const configPrefix = "--config=";
    const projectBaseDir = __dirname.replace(/\/src\/static$|\/out$/, "");
    const configFile =
      process.argv
        .filter(arg => arg.startsWith(configPrefix))
        .map(arg => arg.replace(configPrefix, ""))[0] ||
      path.join(projectBaseDir, "config.json");
    console.log("Config file path", configFile);
    const localConfig = require(configFile);
    config = { ...config, ...localConfig };
  } catch (err) {
    console.log("Warning: Could not read config file, using defaults");
  }

  const overrideConfigWithEnv = envVar => {
    const envValue = process.env[envVar.toUpperCase()];
    if (envValue) {
      console.log("Overriding", envVar, "with", envValue, "from environment");
      config[envVar] = envValue;
    }
  };

  const passConfigParamToApp = param => (process.env[param] = config[param]);

  envParams.forEach(overrideConfigWithEnv);
  appParams.forEach(passConfigParamToApp);
  return config;
};

module.exports = { enrichConfig };
