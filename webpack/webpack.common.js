const { ProvidePlugin, LoaderOptionsPlugin } = require('webpack');
const pkg = require('../package.json');

module.exports = {
    output: {
        filename: `${pkg.name}.js`
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    plugins: [
        new ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        }),
        new LoaderOptionsPlugin({
            minimize: true,
            debug: false
        })
    ],
    module: {
        rules: [
            {
                test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
                loader: 'file-loader',
                options: {
                    name: 'fonts/[hash].[ext]'
                }
            }
        ]
    }
};
