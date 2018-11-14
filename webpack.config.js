const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const autoprefixer = require("autoprefixer");
const isDev = true;

module.exports = {
  entry: {
    app: "./src/client.js"
  },
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: "babel-loader"
      },
      {
        test: /\.(html|pdf|ttf|eot|woff2?)$/,
        use: "file-loader"
      },
      {
        test: /\.json$/,
        use: "json-loader"
      },
      {
        test: /\.(jpe?g|png|gif|svg|webm|mp4)$/,
        include: [path.resolve(__dirname, "../src/assets/images")],
        use: "file-loader"
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"]
      }
    ]
  },
  devServer: {
    contentBase: "./dist",
    port: 3000
  },
  plugins: [
    new CleanWebpackPlugin(["dist"]),
    new CopyPlugin([
      {
        from: path.resolve(__dirname, "./src/assets"),
        to: path.resolve(__dirname, "./dist/public/assets")
      },
      {
        from: path.resolve(__dirname, "./src/index.html"),
        to: path.resolve(__dirname, "./dist/index.html")
      }
    ])
  ],
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist")
  }
};
