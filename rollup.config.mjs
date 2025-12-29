import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
    input: 'app.js',
    output: {
        file: 'dist/app.bundle.js',
        format: 'iife',
        name: 'BalatroApp'
    },
    plugins: [nodeResolve()],
};
