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

Peer dependencies:

| Package              | Version                                     |
| -------------------- | ------------------------------------------- |
| `react`, `react-dom` | 18.2 or later, or 19                        |
| `react-hook-form`    | 7.49.2 or later (7.52 or later on React 19) |

## Quick start

```tsx
import { FieldProps, Form } from '@insoutt/react-simple-form';
import { useState } from 'react';

interface IForm {
  email: string;
  password: string;
}

function required(value: string | number) {
  return value.toString().length > 0 || 'Required field';
}

const formSchema: FieldProps<IForm>[] = [
  { name: 'email', type: 'email', label: 'E-mail', validation: required },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    validation: required,
  },
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
      classNames={{ submitButton: 'btn btn-primary' }}
    />
  );
}
```

## `<Form>` props

| Prop               | Type                                                           | Description                                                                                                                                                                                              |
| ------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fields`           | `FieldProps<T>[]`                                              | **Required.** The form schema.                                                                                                                                                                           |
| `onSubmit`         | `(values: T) => void \| Promise<void>`                         | Called with valid values on submit.                                                                                                                                                                      |
| `onClear`          | `() => void`                                                   | Called when the clear button resets the form.                                                                                                                                                            |
| `beforeSubmit`     | `(values: T) => Promise<T \| boolean>`                         | Runs before `onSubmit`. Return `false` to cancel, `true` to keep values, or a new object to replace them.                                                                                                |
| `afterSubmit`      | `(values: T) => void \| Promise<void>`                         | Runs after `onSubmit` resolves. Skipped if `onSubmit` throws.                                                                                                                                            |
| `validator`        | `Record<string, (value) => boolean \| string \| Promise<...>>` | Named validators referenced by string from a field's `validation`.                                                                                                                                       |
| `validateOnSubmit` | `boolean`                                                      | When `true`, fields don't validate on change until the first submit. After a submit, every field revalidates on change until the form is cleared.                                                        |
| `preprocessors`    | `Record<string, Preprocessor>`                                 | Form-level value transformers keyed by field name.                                                                                                                                                       |
| `defaultValues`    | `DefaultValues<T>`                                             | Initial form values. When they change (compared by value), the form remounts with them and fields they leave out start empty. A change during a submit applies once every submit in flight has finished. |
| `isLoading`        | `boolean`                                                      | Disables inputs and the submit button while truthy.                                                                                                                                                      |
| `loadingText`      | `string`                                                       | Submit button text while busy. Defaults to `submitText`.                                                                                                                                                 |
| `submitText`       | `string`                                                       | Submit button text. Default `"Submit"`.                                                                                                                                                                  |
| `clearText`        | `string`                                                       | Clear button text. Default `"Clear"`.                                                                                                                                                                    |
| `hideClearButton`  | `boolean`                                                      | Hides the clear button.                                                                                                                                                                                  |
| `className`        | `string`                                                       | Class for the `<form>` element.                                                                                                                                                                          |
| `classNames`       | `FormClassNames`                                               | Per-part class overrides (see below).                                                                                                                                                                    |
| `children`         | `ReactNode \| (submit, clear) => ReactElement`                 | Replaces the default action buttons.                                                                                                                                                                     |

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
    props: { placeholder: "...", maxLength: 20 }, // optional, native <input> attributes
}
```

`props` takes any `<input>` attribute (`<select>` attribute on a select), except the ones the form sets itself: `name`, `id`, `type`, `value`, `defaultValue`, `checked`, `defaultChecked`, `onChange`, `onBlur`, `className` and `children`, plus `multiple` on a select.

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
  value.toString().length > 0 || 'Required field';
```

Attach it inline (`validation: required`) or register named validators on the form and reference them by string:

```tsx
<Form<IForm>
  fields={[{ name: 'email', type: 'email', validation: 'required' }]}
  validator={{ required }}
  onSubmit={onSubmit}
/>
```

A field's `validation` is typed by its `type`: a `checkbox` validator receives a `boolean`, a `file` validator a `FileList`, and every other input and a `select` receive a `string | number`. The form-level `validator` record takes validators of any of these types.

By default, inputs and selects validate when they change. A change runs only that field's validator, once, and no validator runs when the form loads. A submit validates every field again.

If a `validation` string has no match in `validator`, the field is treated as valid and a warning is logged.

Fields disabled through `props: { disabled: true }` skip validation and still submit their default value. Without a default, react-hook-form 7.54.2 or later submits the empty value (`''`, or `false` for a checkbox), and older versions submit `undefined`.

## Preprocessors

A preprocessor transforms a field's value on every change, receiving the raw value and the cursor selection.

```ts
import { Preprocessor } from '@insoutt/react-simple-form';

const digitsOnly: Preprocessor = (value /*, { from, end } */) =>
  value.toString().replace(/\D/g, '');
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

When a preprocessor returns a plain value, the caret stays where it was, clamped to the new length. A mask that adds or removes characters before the caret can return `{ value, selection }` to place it:

```ts
import { Preprocessor } from '@insoutt/react-simple-form';

const dashed: Preprocessor = (value, { from }) => {
  const raw = value.toString();
  const digits = raw.replace(/\D/g, '');
  const before = raw.slice(0, from ?? raw.length).replace(/\D/g, '').length;
  const caret = before + (before > 2 ? 1 : 0);
  return {
    value:
      digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits,
    selection: { from: caret, end: caret },
  };
};
```

Preprocessors don't apply to checkboxes, which store their checked boolean as-is.

## Styling

Default classes: `form-group` (wrapper), `form-label`, `form-control` (control), `form-error` (error message), `form-help-text`, `form-action-buttons`. The control also gets state suffixes (e.g. `form-control-error`):

- `-error` while the field has an error.
- `-validating` while its validator runs.
- `-valid` while its current value is one its validator passed, or after a submit if it has no error. No field has it when the form loads or after Clear, until it is validated again. With `validateOnSubmit`, it never appears.

Override via `classNames`:

```tsx
<Form<IForm>
  fields={fields}
  classNames={{
    group: 'mb-3',
    label: 'form-label',
    select: 'form-select',
    input: 'form-control',
    field: 'form-control',
    submitButton: 'btn btn-primary',
    clearButton: 'btn btn-link',
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
      <button type="button" onClick={submit}>
        Save
      </button>
      <button type="button" onClick={clear}>
        Reset
      </button>
    </div>
  )}
</Form>
```

## Examples

### Async validation

A validator can return a promise. While it is pending, the control gets the `-validating` class (`form-control-validating` by default), so you can show a spinner. This one sends a request on each change, and once more for the current value on submit. When answers arrive out of order, the field keeps the answer for its newest value, and `-validating` stays on until that answer arrives.

```tsx
import { FieldProps, Form } from '@insoutt/react-simple-form';

interface ISignUp {
  email: string;
  password: string;
}

async function emailAvailable(value: string | number) {
  const email = value.toString();
  if (email.length === 0) return 'Required field';
  const response = await fetch(
    `/api/email-available?email=${encodeURIComponent(email)}`,
  );
  const { available } = (await response.json()) as { available: boolean };
  return available || 'This e-mail is already registered';
}

const fields: FieldProps<ISignUp>[] = [
  { name: 'email', type: 'email', label: 'E-mail', validation: emailAvailable },
  { name: 'password', type: 'password', label: 'Password' },
];

export function SignUpForm() {
  const onSubmit = async (values: ISignUp) => {
    await fetch('/api/sign-up', {
      method: 'POST',
      body: JSON.stringify(values),
    });
  };

  return <Form<ISignUp> fields={fields} onSubmit={onSubmit} />;
}
```

```css
.form-control-validating {
  background: url('/spinner.svg') no-repeat right 8px center;
}
```

If a validator throws or rejects, the field counts as invalid with an empty error message, and a warning is logged.

### Edit form with default values

Pass the loaded data as `defaultValues`. When it arrives, the form remounts with it. Until then, `isLoading` disables the inputs and the submit button. After a save, `onSubmit` stores the saved values, so they become the new defaults once the submit has finished.

```tsx
import { FieldProps, Form } from '@insoutt/react-simple-form';
import { useEffect, useState } from 'react';

interface IProfile {
  name: string;
  email: string;
  country: string;
}

const fields: FieldProps<IProfile>[] = [
  { name: 'name', type: 'text', label: 'Name' },
  { name: 'email', type: 'email', label: 'E-mail' },
  {
    name: 'country',
    type: 'select',
    label: 'Country',
    options: [
      { value: 'ec', text: 'Ecuador' },
      { value: 'pe', text: 'Peru' },
    ],
  },
];

export function EditProfileForm() {
  const [profile, setProfile] = useState<IProfile>();

  useEffect(() => {
    fetch('/api/profile')
      .then((response) => response.json())
      .then((data: IProfile) => setProfile(data));
  }, []);

  const onSubmit = async (values: IProfile) => {
    await fetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(values),
    });
    setProfile(values);
  };

  return (
    <Form<IProfile>
      fields={fields}
      defaultValues={profile}
      isLoading={!profile}
      submitText="Save"
      clearText="Undo changes"
      onSubmit={onSubmit}
    />
  );
}
```

The clear button ("Undo changes" here) restores the current defaults. It only shows once a value differs from its default.

### Conditional fields

List sub-fields under the option that shows them. Their names are checked against the same interface, so declare them optional: when a sub-field is hidden, its value is dropped from the submitted values and its validation no longer runs.

```tsx
import { FieldProps, Form } from '@insoutt/react-simple-form';

interface IContact {
  name: string;
  contactBy: string;
  email?: string;
  phone?: string;
}

const required = (value: string | number) =>
  value.toString().length > 0 || 'Required field';

const fields: FieldProps<IContact>[] = [
  { name: 'name', type: 'text', label: 'Name', validation: required },
  {
    name: 'contactBy',
    type: 'select',
    label: 'Contact me by',
    validation: required,
    options: [
      {
        value: 'email',
        text: 'E-mail',
        fields: [
          {
            name: 'email',
            type: 'email',
            label: 'E-mail',
            validation: required,
          },
        ],
      },
      {
        value: 'phone',
        text: 'Phone',
        fields: [
          { name: 'phone', type: 'tel', label: 'Phone', validation: required },
        ],
      },
    ],
  },
];

export function ContactForm() {
  const onSubmit = (values: IContact) => {
    // With "Phone" selected: { name: 'Ada', contactBy: 'phone', phone: '555 0100' }
    console.log(values);
  };

  return <Form<IContact> fields={fields} onSubmit={onSubmit} />;
}
```

### Uppercase input

A preprocessor changes the value as the user types, so the field shows and submits the uppercased text.

```tsx
import { FieldProps, Form, Preprocessor } from '@insoutt/react-simple-form';

interface IPassenger {
  name: string;
  passport: string;
}

const uppercase: Preprocessor = (value) => value.toString().toUpperCase();

const fields: FieldProps<IPassenger>[] = [
  { name: 'name', type: 'text', label: 'Name' },
  {
    name: 'passport',
    type: 'text',
    label: 'Passport number',
    preprocessor: uppercase,
  },
];

export function PassengerForm() {
  const onSubmit = (values: IPassenger) => {
    console.log(values.passport); // "AB123456" even when typed as "ab123456"
  };

  return <Form<IPassenger> fields={fields} onSubmit={onSubmit} />;
}
```

### Transform or cancel before submit

`beforeSubmit` runs once validation passes. If it throws, the submit is cancelled and a warning is logged. `afterSubmit` receives the same values as `onSubmit`, so throw from `onSubmit` when the request fails to skip the success message.

```tsx
import { FieldProps, Form } from '@insoutt/react-simple-form';
import { useState } from 'react';

interface IInvite {
  email: string;
  role: string;
}

const fields: FieldProps<IInvite>[] = [
  { name: 'email', type: 'email', label: 'E-mail' },
  {
    name: 'role',
    type: 'select',
    label: 'Role',
    options: [
      { value: 'member', text: 'Member' },
      { value: 'admin', text: 'Admin' },
    ],
  },
];

async function beforeSubmit(values: IInvite): Promise<IInvite | boolean> {
  if (values.role === 'admin' && !window.confirm('Invite as admin?')) {
    return false; // cancel the submit
  }
  const email = values.email.trim().toLowerCase();
  if (email === values.email) {
    return true; // submit the values as they are
  }
  return { ...values, email }; // submit this object instead
}

export function InviteForm() {
  const [message, setMessage] = useState('');

  const onSubmit = async (values: IInvite) => {
    const response = await fetch('/api/invites', {
      method: 'POST',
      body: JSON.stringify(values),
    });
    if (!response.ok) throw new Error(`Invite failed: ${response.status}`);
  };

  return (
    <>
      {message && <p role="status">{message}</p>}
      <Form<IInvite>
        fields={fields}
        beforeSubmit={beforeSubmit}
        onSubmit={onSubmit}
        afterSubmit={(values) => setMessage(`Invite sent to ${values.email}`)}
      />
    </>
  );
}
```

### Validate only on submit

With `validateOnSubmit`, typing in an input or picking an option runs no validators and shows no errors until the first submit. An invalid submit shows the errors and doesn't call `beforeSubmit` or `onSubmit`. After that, each field revalidates when it changes. In this mode a control never gets the `-valid` class, and gets `-validating` only during a submit.

```tsx
import { FieldProps, Form } from '@insoutt/react-simple-form';

interface IFeedback {
  email: string;
  message: string;
}

const required = (value: string | number) =>
  value.toString().length > 0 || 'Required field';

const fields: FieldProps<IFeedback>[] = [
  { name: 'email', type: 'email', label: 'E-mail', validation: required },
  { name: 'message', type: 'text', label: 'Message', validation: required },
];

export function FeedbackForm() {
  const onSubmit = async (values: IFeedback) => {
    await fetch('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(values),
    });
  };

  return (
    <Form<IFeedback> fields={fields} validateOnSubmit onSubmit={onSubmit} />
  );
}
```

### Checkbox and file inputs

A checkbox submits `true` or `false`, and its validator receives that boolean. A file input submits a `FileList`, empty when no file is chosen, and its validator receives the `FileList`. `props` passes native attributes such as `accept` to the input.

```tsx
import { FieldProps, Form } from '@insoutt/react-simple-form';

interface IApplication {
  resume: FileList;
  newsletter: boolean;
  terms: boolean;
}

const fields: FieldProps<IApplication>[] = [
  {
    name: 'resume',
    type: 'file',
    label: 'Resume',
    props: { accept: '.pdf' },
    validation: (value) => value.length > 0 || 'Attach your resume',
  },
  { name: 'newsletter', type: 'checkbox', label: 'Send me the newsletter' },
  {
    name: 'terms',
    type: 'checkbox',
    label: 'I accept the terms',
    validation: (value) => value || 'Accept the terms to continue',
  },
];

export function ApplicationForm() {
  const onSubmit = async ({ resume, newsletter }: IApplication) => {
    const body = new FormData();
    body.append('resume', resume[0]!);
    body.append('newsletter', String(newsletter));
    await fetch('/api/applications', { method: 'POST', body });
  };

  return <Form<IApplication> fields={fields} onSubmit={onSubmit} />;
}
```

## License

This project is licensed under the [MIT license](https://github.com/insoutt/react-simple-form/blob/master/LICENSE).
