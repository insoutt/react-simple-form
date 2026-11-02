---
'@insoutt/react-simple-form': major
---

The package is now ESM only and no longer ships a CommonJS build. `require('@insoutt/react-simple-form')` fails on Node versions without `require(esm)` support (before 20.19 and 22.12) and in CommonJS test setups such as Jest's default, unless they transform `node_modules`; use `import` instead. Deep imports from `dist/esm/...` or `dist/cjs/...` no longer resolve; import from `@insoutt/react-simple-form` instead.

`react`, `react-dom` and `react-hook-form` are now peer dependencies only, so apps must install them themselves; this stops a second copy of React from being installed alongside the app's own.
