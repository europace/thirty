const path = require('path');

module.exports = {
    target: 'node',
    mode: 'production',
    entry: './src/index.ts',
    externals : {
        'aws-sdk': 'aws-sdk'
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'commonjs',
    },
};
