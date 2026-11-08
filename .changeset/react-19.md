---
'@insoutt/react-simple-form': minor
---

React 19 is now supported. React 19 apps need react-hook-form 7.52 or later, which is react-hook-form's own requirement.

With react-hook-form 7.54.2 or later, a field with no default value that is disabled when it mounts (through `props.disabled`, or because the form's `isLoading` is set) submits its empty value (for example `''`, or `false` for a checkbox) instead of `undefined`.
