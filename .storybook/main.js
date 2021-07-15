const path = require("path");

module.exports = {
  stories: ["../src/**/*.story.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials"],
  webpackFinal: async (config, { configType }) => {
    config.module.rules.push({
      test: /\.scss$/,
      use: [
        "style-loader",
        "css-loader",
        {
          loader: "sass-loader",
          options: {
            sassOptions: {
              includePaths: [
                path.resolve(__dirname, "../node_modules/compass-mixins/lib")
              ]
            }
          }
        }
      ],
      include: path.resolve(__dirname, "../src/scss")
    });
    return config;
  }
};
