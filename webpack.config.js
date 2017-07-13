const path = require("path");
const webpack = require("webpack");
let config = {
  "outDir": "out"
};
try {
  config = require("./config.json");
} catch (e) {
  // ignore
}

let plugins = [
  new webpack.HotModuleReplacementPlugin()
];

const shell = require("child_process");
const branch = shell.execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
const commitHash = shell.execSync("git rev-parse HEAD").toString().trim();
const d = new Date();
const padded = str => (str.toString().length < 2) ? "0" + str : str;
const today = `${d.getYear() + 1900}-${padded(d.getMonth())}-${padded(d.getDay())}`;
const BUILD_VERSION = `GRUD.${branch}.${today}.${commitHash}`;

if (process.env.NODE_ENV === "production") {
  plugins = [
    new webpack.HotModuleReplacementPlugin(),
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
  ];
} else {
  plugins.push(new webpack.DefinePlugin({
    "process.env": {
      NODE_ENV: JSON.stringify("devel"),
      BUILD_VERSION: JSON.stringify(`${BUILD_VERSION}-devel`)
    }
  }));
}

module.exports = {
  entry: {
    app: [path.resolve(__dirname, "src/main/js/app.js")]
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
        loader: "react-hot"
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: "babel",
        query: {
          plugins: ["transform-decorators-legacy", "es6-promise"],
          presets: ["es2015", "react", "stage-0"]
        }
      },
      { // required for react-markdown in webpack 1 (see https://github.com/rexxars/react-markdown)
        test: /\.json$/,
        loader: "json-loader"
      },
      {
        test: /\.s?css$/,
        loaders: ["style", "css", "sass"]
      }, {
        test: /\.html$/,
        loader: "file?name=[name].[ext]"
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
  sassLoader: {
    includePaths: [path.resolve(__dirname, "./node_modules/compass-mixins/lib")]
  },
  plugins: plugins,
  resolve: {
    extensions: ["", ".js", ".jsx"]
  }
};
