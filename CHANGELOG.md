# @insoutt/react-simple-form

## 2.3.0

### Minor Changes

- 8379b9c: The caret no longer jumps to the end of the input when a preprocessor changes the value. A preprocessor can return `{ value, selection }` to place the caret itself, for masks that add or remove characters.

## 2.2.0

### Minor Changes

- 4d6f459: Reset the form when `defaultValues` change, stop running validators for other fields, validate selects on change, and type validators and field `props` by field type.

  - When `defaultValues` change after the form mounts, for example once an edit form's data has loaded, the form now resets to the new values and Clear restores them. A field the new values leave out becomes empty, and its edits are dropped. Previously the new values were ignored unless the form was remounted with a `key`. The form remounts to apply them, so the inputs and any components rendered through `children` start fresh. A change that arrives while a submit is running, for example from `onSubmit`, is applied once every submit in flight has finished. A `defaultValues` object re-created on every render with the same values does not reset the form.
  - The `-valid` class now reflects the field, not the whole form: a field has it while its current value is one its validator passed, or after a submit if it has no error. No field has it when the form loads or after Clear until it is validated again, and focusing and leaving a field does not add it. In exchange, a change now runs only that field's validator, once (an input's ran twice, plus every other field's validator), and validators no longer run when the form loads. With `validateOnSubmit`, `-valid` still never appears.
  - A `select` is now validated when it changes, like an input: its error and `-valid` show right after the change instead of only after a submit. With `validateOnSubmit`, a select change still shows no error before the first submit.
  - When an async validator's results arrive out of order, a field that stays mounted and enabled now ends with the result for the value it was last validated with, normally its current value. Previously a slower result for an older value could replace it, for example clearing the error of an invalid value, and the `-validating` class ended as soon as any one result arrived instead of the current value's.
  - A field's `validation` is now typed by the field's `type`: a `checkbox` validator receives a `boolean`, a `file` validator a `FileList`, and every other input and `select` a `string | number`, so `validation: (value) => ...` gets the right type. A validator declared as `(value: string | number) => ...` on a `checkbox` or `file` field no longer compiles: at runtime it always received a `boolean` or a `FileList`, so it was checking the wrong thing. The form-level `validator` record still takes validators of any of these types.
  - A field's `props` now accepts any `<input>` attribute (`<select>` attribute for a select), except the ones the form sets itself: `name`, `id`, `type`, `value`, `defaultValue`, `checked`, `defaultChecked`, `onChange`, `onBlur`, `className` and `children`, plus `multiple` on a select. Previously it accepted only `placeholder` and `disabled`.

## 2.1.0

### Minor Changes

- e786515: React 19 is now supported. React 19 apps need react-hook-form 7.52 or later, which is react-hook-form's own requirement.

  With react-hook-form 7.54.2 or later, a field with no default value that is disabled when it mounts (through `props.disabled`, or because the form's `isLoading` is set) submits its empty value (for example `''`, or `false` for a checkbox) instead of `undefined`.

## 2.0.0

### Major Changes

- 5248882: The package is now ESM only and no longer ships a CommonJS build. `require('@insoutt/react-simple-form')` fails on Node versions without `require(esm)` support (before 20.19 and 22.12) and in CommonJS test setups such as Jest's default, unless they transform `node_modules`; use `import` instead. Deep imports from `dist/esm/...` or `dist/cjs/...` no longer resolve; import from `@insoutt/react-simple-form` instead.

  `react`, `react-dom` and `react-hook-form` are now peer dependencies only, so apps must install them themselves; this stops a second copy of React from being installed alongside the app's own.

### Minor Changes

- 41790e7: Fix validation, Clear button, checkbox and file input bugs, and change how validation, disabled fields and the Clear button behave.

  - With `validateOnSubmit`, validation now runs before `beforeSubmit`, so invalid values never reach `beforeSubmit` or `onSubmit`. This includes a `submit` from the `children` render prop called outside a React event (for example after an `await`), which previously skipped validation.
  - A field mounted while the form is loading is now validated as empty once it is enabled. Previously its value read as `undefined` and its validator was skipped, so a required field could submit without an error.
  - A throwing `beforeSubmit` now logs a warning and skips `onSubmit` instead of rejecting, and a throwing or rejecting validator marks its field invalid and logs a warning. The form no longer stays stuck submitting in either case.
  - Checkboxes now store their checked state as a boolean (they stored the input's `value`), and file inputs keep their selection and submit the selected files.
  - Clear now restores default values for fields that were unregistered and registered again, such as under React StrictMode.
  - Per-field `className`, `groupClassName` and `labelClassName` now override the form-level `classNames` (they were ignored).
  - `select` options with numeric values now show their sub-fields when selected.
  - A string `validation` on a form without a `validator` object now logs a warning (the field still counts as valid) instead of being silently ignored.
  - React no longer logs "Cannot update a component while rendering a different component" when fields register, for example on mount under StrictMode.

  Behavior changes:

  - Clear-button visibility now compares each field with its default value, and a field without a default counts as clean while it is empty (`''`, `false`, `null`/`undefined` or an empty file selection). The button hides again once every field is back to its default or empty, instead of staying visible after a field is cleared. The value watcher lives in the button itself, and `hideClearButton` removes it. With `validateOnSubmit`, typing before the first submit re-renders only the button. Otherwise the validation on each change still re-renders the form and every field, and a `select` change always does because the select watches its own value.
  - Validators always run when react-hook-form validates instead of skipping themselves outside a submit. With `validateOnSubmit`, typing still triggers no validation before the first submit. After any `validateOnSubmit` submit, failed or successful, every field revalidates on change until the form is cleared (previously any change cleared a `select` or `file` error, even to an invalid value, while other inputs kept their error until the next submit).
  - A field whose `props` set `disabled: false` is now still disabled while the form is loading or submitting.
  - Fields disabled through the schema's `props.disabled` are now skipped by validation, and their default values are still submitted. Fields disabled only while the form is loading or submitting are still validated.
  - Checkboxes no longer call `preprocessor` or `preprocessors[name]` and store their checked boolean as-is. Previously the preprocessor received the input's `value` (`"on"`) and its result was stored as the field value.
  - An error thrown by `afterSubmit` is now logged as `afterSubmit failed:` instead of being reported as an `onSubmit` failure.

  Packaging:

  - Source maps now inline their sources.

## [1.0.4] - 2026-06-13

### Changed

- **BREAKING (behavior):** `select` fields are no longer required by default.
  Previously every `<select>` enforced a built-in required rule (error message
  `Obligatorio`). Selects now validate only through their schema `validation`.
  Add `validation` to a select to keep it required.
- Clear-button visibility is now derived from react-hook-form's `isDirty`
  instead of watching every field value. With `validateOnSubmit`, this removes a
  full-form re-render on each keystroke (in the default mode the per-keystroke
  validation still re-renders the form). With `defaultValues` set, the button
  now appears once the form differs from its defaults rather than whenever any
  field is truthy.
- `onSubmit` is now awaited, so `isSubmitting` (and the disabled submit button)
  stays active for the full duration of async submit handlers. `afterSubmit`
  runs only after `onSubmit` resolves and is skipped if `onSubmit` throws.
  `afterSubmit` is awaited too, so the form stays busy (inputs and submit
  disabled) until it resolves.

### Fixed

- Fields are now unregistered on unmount with their `name` (the cleanup
  previously passed `label`). A conditional `select` sub-field's value is now
  removed from the submitted payload once it is hidden after being shown.
  `defaultValues` for sub-fields hidden from the start are still submitted.
- The clear button no longer submits the form (was missing `type="button"`).
- Preprocessed inputs now mark fields as dirty/touched (`setValue` was missing
  `shouldDirty`/`shouldTouch`).
- `classNames.select` is now applied to `select` fields (was declared but
  ignored, falling back to `input`/`field`).
- Submit errors are handled gracefully — a rejected `onSubmit` no longer causes
  an unhandled promise rejection.
- A missing named validator now logs a warning instead of an error.

### Removed

- Dead `undefined` guard in the `cn` helper and the no-op `FormBaseFieldProps`
  type. No public API change.

### Docs

- Rewrote the README with full `<Form>` props, field schema, validation,
  preprocessors, styling, and custom-action examples. Fixed the install command
  (scoped package name) and a broken example variable.

### Packaging

- The published tarball now ships only `dist` (added `files`), and a
  `prepublishOnly` hook builds both the ESM and CJS targets before publishing.

[1.0.4]: https://github.com/insoutt/react-simple-form/compare/5254c8d...v1.0.4
