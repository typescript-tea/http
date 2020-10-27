module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: "./src/__examples__/example.tsx",
  output: {
    filename: "bundle.js"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [{ test: /\.tsx?$/, loader: "ts-loader" }]
  },
  devServer: {
    contentBase: "public",
    stats: "errors-only",
  }
};
