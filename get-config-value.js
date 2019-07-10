const { enrichConfig } = require("./src/static/ServerConfigTool");
const config = enrichConfig({});
const param = process.argv[2];
console.log(config[param]);
