const esbuild = require('esbuild');
const path = require('path');

const common = {
  bundle: true,
  platform: 'node',
  external: ['vscode'],
  logLevel: 'info',
};

esbuild.build({
  ...common,
  entryPoints: [path.join('src', 'extension.ts')],
  outfile: path.join('dist', 'extension.js'),
  sourcemap: true,
});

esbuild.build({
  ...common,
  entryPoints: [path.join('src', 'server', 'index.ts')],
  outfile: path.join('dist', 'server', 'index.js'),
  sourcemap: true,
});
