const path = require("path");

module.exports = {
  module: {
    rules: [
      // {
      //   test: /\.scss$/,
      //   loaders: ["style-loader", "css-loader", "sass-loader"],
      //   include: path.resolve(__dirname, "../")
      // },
      {
        test: /\.s?css$/,
        include: path.resolve(__dirname, "../"),
        use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader"
          },
          {
            loader: "sass-loader",
            options: {
              includePaths: [
                path.resolve(__dirname, "../node_modules/compass-mixins/lib")
              ]
            }
          }
        ]
      },
      {
        test: /\.woff2(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader:
          "url-loader?limit=10000&name=./fonts/[hash].[ext]&mimetype=application/font-woff2"
      },
      {
        test: /\.woff(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader:
          "url-loader?limit=10000&name=./fonts/[hash].[ext]&mimetype=application/font-woff"
      },
      {
        test: /\.ttf(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader:
          "url-loader?limit=10000&name=./fonts/[hash].[ext]&mimetype=application/font-ttf"
      },
      {
        test: /\.eot(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader:
          "url-loader?limit=10000&name=./fonts/[hash].[ext]&mimetype=application/vnd.ms-fontobject"
      },
      {
        test: /\.(svg|gif|jpg|jpeg|png)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "file-loader?name=./img/[hash].[ext]"
      }
    ]
  }
};
