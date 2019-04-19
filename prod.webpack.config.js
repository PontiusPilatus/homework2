const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	mode: "production",

	entry: {
		index: ['./src/index.js']
	},

	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].js'
	},

	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env']
						}
					}
				]
			}
		]
	},

	plugins: [
		new HtmlWebpackPlugin({
			inject: true,
			template: path.join(__dirname, 'src/index.html'),
			chunks: ["index"],
			filename: 'index.html'
		})
	],
};