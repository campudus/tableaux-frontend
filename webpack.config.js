"use strict";

const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const _ = require("lodash");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");

const config = getBuildConfig();
const isProductionBuild = process.env.NODE_ENV === "production";

let plugins = [
  new webpack.ProvidePlugin({
    // needed for IE 11 to support DOM Level 4
    "dom4": "imports-loader?this=>global?dom4"
  }),
  new CleanWebpackPlugin([config.outDir]),
  new CopyWebpackPlugin([
    {
      context: "src/main",
      from: "img/**"
    },
    {
      context: "src/main",
      from: "locales/**"
    }
  ]),
  new webpack.NoEmitOnErrorsPlugin(),
  new webpack.DefinePlugin({
    "process.env": {
      NODE_ENV: JSON.stringify(isProductionBuild ? process.env.NODE_ENV : "devel"),
      BUILD_VERSION: JSON.stringify(getBuildVersion())
    }
  })
];

if (isProductionBuild) {
  // production build
  plugins.push(
    new UglifyJSPlugin({
      uglifyOptions: {
        mangle: {
          reserved: ["require", "export", "$super"]
        },
        ie8: false,
        compress: {
          warnings: false,
          sequences: true,
          dead_code: true,
          conditionals: true,
          booleans: true,
          unused: true,
          if_return: true,
          join_vars: true,
          drop_console: false,
          comparisons: true,
          evaluate: true
        }
      }
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.HashedModuleIdsPlugin()
  );
} else {
  // development build
  plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin()
  );
}

const webpackEntryArray = isProductionBuild
  ? ["babel-polyfill", path.resolve(__dirname, "src/main/js/app.js")]
  : ["babel-polyfill", "react-hot-loader/patch", path.resolve(__dirname, "src/main/js/app.js")];

module.exports = {
  entry: {
    app: webpackEntryArray
  },
  devtool: isProductionBuild ? false : "source-maps",
  devServer: {
    contentBase: config.outDir,
    publicPath: "/",
    hot: !(isProductionBuild),
    hotOnly: !(isProductionBuild),
    historyApiFallback: true,
    compress: true,

    host: config.host,
    port: config.serverPort,

    proxy: {
      "/api/*": {
        target: `http://${config.host}:${config.apiPort}`,
        pathRewrite: {"^/api": ""},
        xfwd: true,
        onProxyReq: (proxyReq, req) => {
          proxyReq.setHeader("X-Forwarded-Url", req.originalUrl);
        }
      }
    },

    stats: {
      colors: true
    }
  },
  output: {
    path: path.resolve(config.outDir),
    filename: "js/[name].js",
    publicPath: "/"
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loaders: ["babel-loader"]
      },
      {
        test: /\.s?css$/,
        use: [
          {
            loader: "style-loader"
          }, {
            loader: "css-loader"
          }, {
            loader: "sass-loader",
            options: {
              includePaths: [path.resolve(__dirname, "./node_modules/compass-mixins/lib")]
            }
          }
        ]
      },
      {
        test: /\.html$/,
        loader: "file-loader?name=[name].[ext]"
      },
      {
        test: /\.woff2(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "url-loader?limit=10000&name=./fonts/[hash].[ext]&mimetype=application/font-woff2"
      },
      {
        test: /\.woff(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "url-loader?limit=10000&name=./fonts/[hash].[ext]&mimetype=application/font-woff"
      },
      {
        test: /\.ttf(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "url-loader?limit=10000&name=./fonts/[hash].[ext]&mimetype=application/font-ttf"
      },
      {
        test: /\.eot(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "url-loader?limit=10000&name=./fonts/[hash].[ext]&mimetype=application/vnd.ms-fontobject"
      },
      {
        test: /\.(svg|gif|jpg|jpeg|png)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "file-loader?name=./img/[hash].[ext]"
      }
    ]
  },
  plugins: plugins,
  resolve: {
    extensions: [".json", ".js", ".jsx"]
  }
};

function getBuildVersion() {
  let currentGitHead = "commitDate.commitHash";

  try {
    const shell = require("child_process");
    const commitHash = shell.execSync("git rev-parse --short HEAD").toString().trim();
    const commitDate = shell.execSync("git show -s --format=%ci HEAD").toString().trim().replace(/ /g, "_");

    currentGitHead = `${commitDate}.${commitHash}`;
  } catch (e) {
    console.error("Either we have no git or we're on Windows.");
  }

  return isProductionBuild
    ? currentGitHead
    : `${currentGitHead}-devel`;
}

function getBuildConfig() {
  const configDefault = {
    "outDir": "out",
    "host": "localhost",
    "apiPort": 8080,
    "serverPort": 3000
  };

  const configJson = (() => {
    try {
      if (fs.existsSync("./config.json")) {
        const data = fs.readFileSync("./config.json");
        return JSON.parse(data);
      } else {
        return {};
      }
    } catch (err) {
      console.error("Failed to read or parse config.json", err);
      return {};
    }
  })();

  // env variables overwrites config.json overwrites default config (e.g. from IDE)
  const configEnv = {
    host: process.env.HOST,
    apiPort: process.env.APIPORT,
    serverPort: process.env.SERVERPORT,
    outDir: process.env.OUTDIR
  };

  const config = Object.assign(
    {},
    configDefault,
    _.omitBy(configJson, _.isNil),
    _.omitBy(configEnv, _.isNil)
  );

  console.log("Start tableaux frontend with config:", JSON.stringify(config), "\n");

  return config;
}
