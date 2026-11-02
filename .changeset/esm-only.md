---
'@insoutt/react-simple-form': major
---

The package is now ESM only and no longer ships a CommonJS build. `require('@insoutt/react-simple-form')` fails on Node versions without `require(esm)` support (before 20.19 and 22.12) and in CommonJS test setups such as Jest's default, unless they transform `node_modules`; use `import` instead.
