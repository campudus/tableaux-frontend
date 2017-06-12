var path = require('path');
var webpack = require('webpack');
var config = {
  "outDir": "out"
};
try {
  config = require('./config.json');
} catch (e) {
  // ignore
}

var plugins = [
  new webpack.HotModuleReplacementPlugin()
];

if (process.env.NODE_ENV === 'production') {
  plugins = [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV)
      }
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      mangle: {
        except: ['require', 'export', '$super']
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
}

module.exports = {
  entry: {
    app: [path.resolve(__dirname, 'src/main/js/app.js')]
  },
  output: {
    path: path.resolve(config.outDir),
    filename: 'js/[name].js',
    publicPath: '/'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'react-hot'
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          plugins: ['transform-decorators-legacy', 'es6-promise'],
          presets: ['es2015', 'react', 'stage-0']
        }
      },
      { // required for react-markdown in webpack 1 (see https://github.com/rexxars/react-markdown)
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.s?css$/,
        loaders: ['style', 'css', 'sass']
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
    extensions: ['', '.js', '.jsx']
  }
};
