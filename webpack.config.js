"use strict";

const path = require("path");
const webpack = require("webpack");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

let config = {
  "outDir": "out"
};
try {
  config = require("./config.json");
} catch (e) {
  // ignore
}

let plugins = [
  new webpack.HotModuleReplacementPlugin(),
  new webpack.ProvidePlugin({
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
  new webpack.NamedModulesPlugin(),
  new webpack.NoEmitOnErrorsPlugin()
];

let BUILD_VERSION = "local-build";
try {
  const shell = require("child_process");
  const commitHash = shell.execSync("git rev-parse --short HEAD").toString().trim();
  const commitDate = shell.execSync("git show -s --format=%ci HEAD").toString().trim().replace(/ /g, "_");
  BUILD_VERSION = `${commitDate}.${commitHash}`;
} catch (e) {
  // Either we have no git or we're on Windows
}

if (process.env.NODE_ENV === "production") {
  plugins.push(
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        BUILD_VERSION: JSON.stringify(BUILD_VERSION)
      }
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      mangle: {
        except: ["require", "export", "$super"]
      },
      compress: {
        warnings: false,
        sequences: true,
        dead_code: true,
        conditionals: true,
        booleans: true,
        unused: true,
        if_return: true,
        join_vars: true,
        drop_console: false
      }
    })
  );
} else {
  plugins.push(new webpack.DefinePlugin({
    "process.env": {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || "devel"),
      BUILD_VERSION: JSON.stringify(`${BUILD_VERSION}-${process.env.NODE_ENV || "devel"}`)
    }
  }));
}

module.exports = {
  entry: {
    app: [
      "babel-polyfill",
      "react-hot-loader/patch",
      path.resolve(__dirname, "src/main/js/app.js")
    ]
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
        loaders: ["react-hot-loader/webpack", "babel-loader"]
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
