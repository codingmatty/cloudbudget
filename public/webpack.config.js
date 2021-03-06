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
      'components': path.resolve(__dirname, './src/components')
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
        loaders: ["style", "css?sourceMap", "sass?sourceMap"]
      },
      {
        test: /\.js$/,
        loader: 'babel!eslint',
        exclude: /node_modules|src\/lib/
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
  },
  eslint: {
    formatter: require('eslint-friendly-formatter')
  },
  devtool: 'eval-source-map'
};