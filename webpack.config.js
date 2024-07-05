/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'asyncWave',
    libraryTarget: 'umd',
    globalObject: 'this',
    umdNamedDefine: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: false, // 타입 체크와 파일 출력을 함께 수행
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new ForkTsCheckerWebpackPlugin({
      async: false,
      typescript: {
        configFile: path.resolve(__dirname, 'tsconfig.json'),
      },
    }),
  ],
  externals: {
    // 예: react: 'react',
    // lodash: 'lodash'
  },
};
