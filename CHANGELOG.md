# @insoutt/react-simple-form

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
