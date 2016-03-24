var path = require('path');
var webpack = require('webpack');
var config = {
  "outDir" : "out"
};
try {
  config = require('./config.json');
} catch (e) {
  // ignore
}

module.exports = {
  entry : {
    app : [path.resolve(__dirname, 'src/main/js/app.js')]
  },
  output : {
    path : path.resolve(config.outDir),
    filename : 'js/[name].js',
    publicPath : '/'
  },
  module : {
    loaders : [{
      test : /\.jsx?$/,
      exclude : /node_modules/,
      loader : 'react-hot'
    }, {
      test : /\.jsx?$/,
      exclude : /node_modules/,
      loader : 'babel',
      query : {
        plugins : ['transform-decorators-legacy'],
        presets : ['es2015', 'react', 'stage-0']
      }
    }, {
      test : /\.s?css$/,
      loaders : ['style', 'css', 'sass']
    }, {
      test : /\.html$/,
      loader : "file?name=[name].[ext]"
    },
      {
        test : /\.woff2(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader : "url-loader?limit=10000&name=./fonts/[hash].[ext]&mimetype=application/font-woff2"
      },
      {
        test : /\.woff(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader : "url-loader?limit=10000&name=./fonts/[hash].[ext]&mimetype=application/font-woff"
      },
      {
        test : /\.ttf(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader : "url-loader?limit=10000&name=./fonts/[hash].[ext]&mimetype=application/font-ttf"
      },
      {
        test : /\.eot(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader : "url-loader?limit=10000&name=./fonts/[hash].[ext]&mimetype=application/vnd.ms-fontobject"
      },
      {
        test : /\.(svg|gif|jpg|jpeg|png)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader : "file-loader?name=./img/[hash].[ext]"
      }
    ]
  },
  sassLoader : {
    includePaths : [path.resolve(__dirname, "./node_modules/compass-mixins/lib")]
  },
  plugins : [
    new webpack.HotModuleReplacementPlugin()
  ],
  resolve : {
    extensions : ['', '.js', '.jsx']
  }
};
