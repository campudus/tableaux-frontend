const path = require('path');

module.exports = {
  module: {
    rules: [
      {
        test: /\.s?css.?$/,
        loaders: [
          "style-loader",
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              includePaths: [path.resolve(__dirname, "../node_modules/compass-mixins/lib")]
            }
          }
        ],
        include: path.resolve(__dirname, '../')
      },
      {
        test: /\.html$/,
        loader: "file-loader?name=[name].[ext]"
      },
      {
        test: /\.woff2(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "url-loader?limit=10000&name=../fonts/[hash].[ext]&mimetype=application/font-woff2"
      },
      {
        test: /\.woff(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "url-loader?limit=10000&name=../fonts/[hash].[ext]&mimetype=application/font-woff"
      },
      {
        test: /\.ttf(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "url-loader?limit=10000&name=../fonts/[hash].[ext]&mimetype=application/font-ttf"
      },
      {
        test: /\.eot(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "url-loader?limit=10000&name=../fonts/[hash].[ext]&mimetype=application/vnd.ms-fontobject"
      },
      {
        test: /\.(svg|gif|jpg|jpeg|png)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "file-loader?name=../img/[hash].[ext]"
      }
    ]
  }
};
