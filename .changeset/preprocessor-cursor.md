---
'@insoutt/react-simple-form': minor
---

The caret no longer jumps to the end of the input when a preprocessor changes the value. A preprocessor can return `{ value, selection }` to place the caret itself, for masks that add or remove characters.
