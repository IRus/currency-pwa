const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = function (env, argv) {
  return {
    entry: {
      app: [
        path.resolve(__dirname, "src", "index.tsx")
      ]
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js?[contenthash]",
      chunkFilename: "[name].bundle.js?[chunkhash]",
      publicPath: "/"
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"]
    },
    devtool: argv.mode === "production" ? "source-map" : "eval-source-map",
    module: {
      rules: [{
        test: /\.tsx?$/,
        use: [{loader: "ts-loader"}]
      }, {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, {loader: "css-loader"}]
      }, {
        test: /\.(png|jpg|gif|svg)$/,
        type: "asset",
        parser: {
          dataUrlCondition: {
            maxSize: 32768
          }
        }
      }]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "src", "index.html"),
        hash: true
      }),
      new MiniCssExtractPlugin(),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, "src", "assets"),
            to: path.resolve(__dirname, "dist", "assets"),
            filter: (resourcePath) => !resourcePath.endsWith(".sh"),
          }
        ]
      }),
    ]
  }
};

