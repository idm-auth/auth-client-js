import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
    preserveModules: true,
  },
  external: ['@opentelemetry/api'],
  plugins: [
    nodeResolve({ extensions: ['.ts', '.js'] }),
    typescript(),
    replace({
      __PKG_NAME__: pkg.name,
      __PKG_VERSION__: pkg.version,
      preventAssignment: true,
    }),
  ],
};
