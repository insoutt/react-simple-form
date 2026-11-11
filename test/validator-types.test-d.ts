import { expectTypeOf, test } from 'vitest';
import type { FieldProps, Validator } from '../src/index.js';

type Values = { x: string };
const options = [{ value: 'a', text: 'A' }];
const required = (value: string | number) =>
  value.toString().length > 0 || 'Required';

test('an unannotated inline validator on a text field or a select gets string | number', () => {
  const fields: FieldProps<Values>[] = [
    {
      name: 'x',
      type: 'text',
      validation: (value) => {
        expectTypeOf(value).toEqualTypeOf<string | number>();
        return required(value);
      },
    },
    {
      name: 'x',
      type: 'select',
      options,
      validation: (value) => {
        expectTypeOf(value).toEqualTypeOf<string | number>();
        return required(value);
      },
    },
  ];
  void fields;
});

test('an unannotated checkbox validator gets boolean', () => {
  const fields: FieldProps<Values>[] = [
    {
      name: 'x',
      type: 'checkbox',
      validation: (value) => {
        expectTypeOf(value).toEqualTypeOf<boolean>();
        return value || 'Required';
      },
    },
  ];
  void fields;
});

test('an unannotated file validator gets FileList', () => {
  const fields: FieldProps<Values>[] = [
    {
      name: 'x',
      type: 'file',
      validation: (value) => {
        expectTypeOf(value).toEqualTypeOf<FileList>();
        return value.length > 0 || 'Required';
      },
    },
  ];
  void fields;
});

test('a validator declared for string | number still type-checks on text-like fields, selects and the validator record', () => {
  const fields: FieldProps<Values>[] = [
    { name: 'x', type: 'text', validation: required },
    { name: 'x', type: 'number', validation: required },
    { name: 'x', type: 'radio', validation: required },
    { name: 'x', type: 'select', options, validation: required },
  ];
  const validator: Validator = { required };
  void [fields, validator];
});

test('the validator record also takes boolean and FileList validators', () => {
  const accepted = (value: boolean) => value || 'Required';
  const hasFiles = async (value: FileList) => value.length > 0 || 'Required';
  const validator: Validator = { accepted, hasFiles };
  void validator;
});

test('a validator declared for string | number no longer type-checks on a checkbox or file field', () => {
  const fields: FieldProps<Values>[] = [
    // @ts-expect-error it receives a boolean at runtime
    { name: 'x', type: 'checkbox', validation: required },
    // @ts-expect-error it receives a FileList at runtime
    { name: 'x', type: 'file', validation: required },
  ];
  void fields;
});
