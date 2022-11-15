const path = require('path');

module.exports = {
    entry: {
        create: './client/create.jsx',
        home: './client/home.jsx',
        library: './client/library.jsx',
        login: './client/login.jsx',
        profile: './client/profile.jsx',
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                },
            },
        ],
    },
    mode: 'production',
    watchOptions: {
        aggregateTimeout: 200,
    },
    output: {
        path: path.resolve(__dirname, 'hosted'),
        filename: '[name]Bundle.js',
    }
};