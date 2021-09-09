// Find the full example of all available configuration options at
// https://github.com/muenzpraeger/create-lwc-app/blob/main/packages/lwc-services/example/lwc-services.config.js
module.exports = {
    resources: [{ from: 'src/client/resources', to: 'dist/resources/' }],
    sourceDir: './src/client',
    devServer: {
        contentBase: './src/client',
        proxy: { '/': 'http://localhost:3002' }
    },
    lwcCompilerOutput: {
        production: {
            compat: false,
            minify: true,
            env: {
                NODE_ENV: 'production'
            }
        }
    }
};
