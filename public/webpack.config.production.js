var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: {
    app: "./src/app.js",
    styles: "./src/main.scss"
  },
  output: {
    path: path.resolve(__dirname, './dist/static'),
    publicPath: '/static/',
    filename: '[name]'
  },
  resolve: {
    alias: {
      'config': path.resolve(__dirname, './src/config'),
      'components': path.resolve(__dirname, './src/components'),
      'modules': path.resolve(__dirname, './src/modules')
    }
  },
  module: {
    loaders: [
      {
        test: /\.html$/,
        loader: "html"
      },
      {
        test: /\.scss/,
        loaders: ["style", "css", "sass"]
      },
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/
      },
      {
        test: /\.json$/,
        loader: 'json'
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'url',
        query: {
          limit: 10000,
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  }
};