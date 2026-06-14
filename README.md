# react-simple-form

Build React forms from a typed JSON schema. You describe fields as data, `react-simple-form` renders the inputs and wires up validation, preprocessing, and submission through [react-hook-form](https://react-hook-form.com/).

## Features

- Schema-driven: declare fields as an array, get a working form.
- Fully typed: field `name`s are checked against your form interface.
- Inline or named validators, sync or async.
- Per-field and form-level value preprocessors (masking/formatting).
- `select` fields with conditional nested fields.
- Customizable class names, submit/clear buttons, and a render-prop escape hatch.

## Installation

```bash
npm install @insoutt/react-simple-form
# or
yarn add @insoutt/react-simple-form
```

Peer dependencies: `react`, `react-dom`, `react-hook-form`.

## Quick start

```tsx
import { FieldProps, Form } from "@insoutt/react-simple-form";
import { useState } from "react";

interface IForm {
    email: string;
    password: string;
}

function required(value: string | number) {
    return value.toString().length > 0 || "Required field";
}

const formSchema: FieldProps<IForm>[] = [
    { name: "email", type: "email", label: "E-mail", validation: required },
    { name: "password", type: "password", label: "Password", validation: required },
];

function App() {
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async ({ email, password }: IForm) => {
        setIsLoading(true);
        // ...submit logic
        setIsLoading(false);
    };

    return (
        <Form<IForm>
            fields={formSchema}
            isLoading={isLoading}
            onSubmit={onSubmit}
            classNames={{ submitButton: "btn btn-primary" }}
        />
    );
}
```

## `<Form>` props

| Prop | Type | Description |
|------|------|-------------|
| `fields` | `FieldProps<T>[]` | **Required.** The form schema. |
| `onSubmit` | `(values: T) => void \| Promise<void>` | Called with valid values on submit. |
| `onClear` | `() => void` | Called when the clear button resets the form. |
| `beforeSubmit` | `(values: T) => Promise<T \| boolean>` | Runs before `onSubmit`. Return `false` to cancel, `true` to keep values, or a new object to replace them. |
| `afterSubmit` | `(values: T) => void \| Promise<void>` | Runs after `onSubmit` resolves. Skipped if `onSubmit` throws. |
| `validator` | `Record<string, (value) => boolean \| string \| Promise<...>>` | Named validators referenced by string from a field's `validation`. |
| `validateOnSubmit` | `boolean` | When `true`, fields validate only on submit instead of on change. |
| `preprocessors` | `Record<string, Preprocessor>` | Form-level value transformers keyed by field name. |
| `defaultValues` | `DefaultValues<T>` | Initial form values. |
| `isLoading` | `boolean` | Disables inputs and the submit button while truthy. |
| `loadingText` | `string` | Submit button text while busy. Defaults to `submitText`. |
| `submitText` | `string` | Submit button text. Default `"Submit"`. |
| `clearText` | `string` | Clear button text. Default `"Clear"`. |
| `hideClearButton` | `boolean` | Hides the clear button. |
| `className` | `string` | Class for the `<form>` element. |
| `classNames` | `FormClassNames` | Per-part class overrides (see below). |
| `children` | `ReactNode \| (submit, clear) => ReactElement` | Replaces the default action buttons. |

## Field schema

Each entry in `fields` is an input or a select.

### Inputs

```ts
{
    name: "phone",          // keyof your form interface (type-checked)
    type: "tel",            // text | number | email | password | date | time |
                            // checkbox | radio | file | hidden | range | color |
                            // search | tel | url
    label: "Phone",         // optional
    helpText: "With area code", // optional, rendered under the field
    validation: required,   // optional, function or named-validator string
    preprocessor: digitsOnly, // optional
    props: { placeholder: "...", disabled: false }, // extra input props
}
```

### Selects

```ts
{
    name: "country",
    type: "select",
    label: "Country",
    options: [
        { value: "us", text: "United States" },
        {
            value: "other",
            text: "Other",
            // fields shown only while this option is selected:
            fields: [{ name: "countryName", type: "text", label: "Which?" }],
        },
    ],
}
```

A `select` renders an `N/A` empty option first, then your `options`. Use `validation` to make it required — there is no implicit required rule.

## Validation

A validator returns `true` when valid, or a `string` error message otherwise. It may be async.

```ts
const required = (value: string | number) =>
    value.toString().length > 0 || "Required field";
```

Attach it inline (`validation: required`) or register named validators on the form and reference them by string:

```tsx
<Form<IForm>
    fields={[{ name: "email", type: "email", validation: "required" }]}
    validator={{ required }}
    onSubmit={onSubmit}
/>
```

If a `validation` string has no match in `validator`, the field is treated as valid and a warning is logged.

## Preprocessors

A preprocessor transforms a field's value on every change, receiving the raw value and the cursor selection.

```ts
import { Preprocessor } from "@insoutt/react-simple-form";

const digitsOnly: Preprocessor = (value /*, { from, end } */) =>
    value.toString().replace(/\D/g, "");
```

Apply per field (`preprocessor: digitsOnly`) or form-wide keyed by field name:

```tsx
<Form<IForm>
    fields={fields}
    preprocessors={{ phone: digitsOnly }}
    onSubmit={onSubmit}
/>
```

A field's own `preprocessor` takes precedence over the form-level `preprocessors` entry.

## Styling

Default classes: `form-group` (wrapper), `form-label`, `form-control` (control), `form-error` (error message), `form-help-text`, `form-action-buttons`. The control also gets state suffixes: `-error`, `-validating`, `-valid` (e.g. `form-control-error`).

Override via `classNames`:

```tsx
<Form<IForm>
    fields={fields}
    classNames={{
        group: "mb-3",
        label: "form-label",
        select: "form-select",
        input: "form-control",
        field: "form-control",
        submitButton: "btn btn-primary",
        clearButton: "btn btn-link",
    }}
    onSubmit={onSubmit}
/>
```

For a single field, use its `groupClassName`, `labelClassName`, and `className`.

## Custom actions

Pass a function as `children` to render your own buttons with access to `submit` and `clear`:

```tsx
<Form<IForm> fields={fields} onSubmit={onSubmit}>
    {(submit, clear) => (
        <div>
            <button type="button" onClick={submit}>Save</button>
            <button type="button" onClick={clear}>Reset</button>
        </div>
    )}
</Form>
```

## License

This project is licensed under the [MIT license](https://github.com/insoutt/react-simple-form/blob/master/LICENSE).
