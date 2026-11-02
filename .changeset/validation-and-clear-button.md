---
'@insoutt/react-simple-form': minor
---

Fix validation, Clear button, checkbox and file input bugs, and change how validation, disabled fields and the Clear button behave.

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
