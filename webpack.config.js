var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: [
        './src/Main.js'
    ],
    output: {path: __dirname, filename: 'dist/shards.js'},
    cache: true,
    debug: true,
    devtool: 'source-map',
    module: {
        loaders: [
            {
                test: /\.(glsl|vs|fs)$/, 
                loader: 'shader' 
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                include: [
                    path.resolve(__dirname, 'src')
                ],
                query: {
                    presets: ['es2015']
                }
            },
            {
                test: /\.scss$/,
                loader: 'style!css!sass?sourceMap'
            }
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            'THREE': 'three',
            'TWEEN': 'tween.js'
        })
    ]
};
