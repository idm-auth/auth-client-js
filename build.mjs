import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const commonConfig = {
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  external: ['@opentelemetry/*'],
  packages: 'external',
  define: {
    __PKG_NAME__: JSON.stringify(pkg.name.replace('@', '').replace('/', '-')),
    __PKG_VERSION__: JSON.stringify(pkg.version),
  },
};

await esbuild.build({
  ...commonConfig,
  entryPoints: ['src/index.ts'],
  outdir: 'dist',
  outbase: 'src',
  splitting: true,
  chunkNames: 'chunks/[name]-[hash]',
});

console.log('Build completed!');
