# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Clear-button visibility now compares each field with its default value, and a
  field without a default counts as clean while it is empty (`''`, `false`,
  `null`/`undefined` or an empty file selection). The button hides again once
  every field is back to its default or empty, instead of staying visible after
  a field is cleared. The value watcher lives in the button itself, and
  `hideClearButton` removes it. With `validateOnSubmit`, typing before the first
  submit re-renders only the button. Otherwise the validation on each change
  still re-renders the form and every field, and a `select` change always does
  because the select watches its own value.
- Validators always run when react-hook-form validates instead of skipping
  themselves outside a submit. With `validateOnSubmit`, typing still triggers no
  validation before the first submit. After a failed `validateOnSubmit`
  submit, every field revalidates on change (previously any change cleared a
  `select` or `file` error, even to an invalid value, while other inputs kept
  their error until the next submit).
- A field whose `props` set `disabled: false` is now still disabled while the
  form is loading or submitting.
- Checkboxes no longer call `preprocessor` or `preprocessors[name]` and store
  their checked boolean as-is. Previously the preprocessor received the input's
  `value` (`"on"`) and its result was stored as the field value.
- An error thrown by `afterSubmit` is now logged as `afterSubmit failed:`
  instead of being reported as an `onSubmit` failure.

### Fixed

- With `validateOnSubmit`, validation now runs before `beforeSubmit`, so invalid
  values never reach `beforeSubmit` or `onSubmit`. This includes a `submit`
  from the `children` render prop called outside a React event (for example
  after an `await`), which previously skipped validation.
- A field mounted while the form is loading is now validated as empty once it
  is enabled. Previously its value read as `undefined` and its validator was
  skipped, so a required field could submit without an error.
- A throwing `beforeSubmit` now logs a warning and skips `onSubmit` instead of
  rejecting, and a throwing or rejecting validator marks its field invalid and
  logs a warning. The form no longer stays stuck submitting in either case.
- Checkboxes now store their checked state as a boolean (they stored the
  input's `value`), and file inputs keep their selection and submit the
  selected files.
- Clear now restores default values for fields that were unregistered and
  registered again, such as under React StrictMode.
- Per-field `className`, `groupClassName` and `labelClassName` now override the
  form-level `classNames` (they were ignored).
- `select` options with numeric values now show their sub-fields when selected.
- A string `validation` on a form without a `validator` object now logs a
  warning (the field still counts as valid) instead of being silently ignored.

### Packaging

- `CHANGELOG.md` is now included in the published package, and source maps
  inline their sources.

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

[Unreleased]: https://github.com/insoutt/react-simple-form/compare/v1.0.4...HEAD
[1.0.4]: https://github.com/insoutt/react-simple-form/compare/5254c8d...v1.0.4
