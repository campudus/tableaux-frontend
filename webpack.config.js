const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const autoprefixer = require("autoprefixer");
const isDev = process.env.NODE_ENV !== "production";
const LiveReloadPlugin = require("webpack-livereload-plugin");

module.exports = {
  entry: {
    app: ["babel-regenerator-runtime","./src/app/router/router.js"],
    worker: "./src/worker.js"
  },
  watchOptions:{
    ignored: "/node_modules/"
  },
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: [path.resolve(__dirname,"src"),path.resolve(__dirname,"node_modules/superagent")],
        use: "babel-loader",
      },
      {
        test: /\.json$/,
        use: "json-loader",
      },
      {
        test: /\.(jpe?g|png\*?|gif|svg|webm|mp4)$/,
        include: [path.resolve(__dirname, "./src/img")],
        use: "file-loader",
      },
      {
        test: /\.s?css$/,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
          },
          {
            loader: "sass-loader",
            options: {
              includePaths: [
                path.resolve(__dirname, "./node_modules/compass-mixins/lib"),
              ],
            },
          },
        ],
      },
      {
        test: /\.woff2(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader:
          "url-loader?limit=10000&name=/fonts/[hash].[ext]&mimetype=application/font-woff2",
      },
      {
        test: /\.woff(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader:
          "url-loader?limit=10000&name=/fonts/[hash].[ext]&mimetype=application/font-woff",
      },
      {
        test: /\.ttf(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader:
          "url-loader?limit=10000&name=/fonts/[hash].[ext]&mimetype=application/font-ttf",
      },
      {
        test: /\.eot(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader:
          "url-loader?limit=10000&name=/fonts/[hash].[ext]&mimetype=application/vnd.ms-fontobject",
      },
      {
        test: /\.(svg|gif|jpg|jpeg|png)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "file-loader?name=/img/[hash].[ext]",
      },
    ],
  },
  resolve: {
    extensions:[".js",".jsx"]
  },
  plugins: [
    new LiveReloadPlugin({port:3003, hostname:"localhost",protocol:"http"}),
    new CleanWebpackPlugin(["dist/app.bundle.js"]),
    new CopyPlugin([
      {
        from: path.resolve(__dirname, "./src/assets"),
        to: path.resolve(__dirname, "./dist/public/assets"),
      },
      {
        from: path.resolve(__dirname, "./src/img"),
        to: path.resolve(__dirname, "./dist/img"),
      },
      {
        from: path.resolve(__dirname, "./src/index.html"),
        to: path.resolve(__dirname, "./dist/index.html"),
      },
    ]),
  ],
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
};
