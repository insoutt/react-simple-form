import { test } from 'vitest';
import type { FieldProps } from '../src/index.js';

type Values = { x: string };
const options = [{ value: 'a', text: 'A' }];

test('placeholder and disabled still type-check on inputs and selects', () => {
  const fields: FieldProps<Values>[] = [
    { name: 'x', type: 'text', props: { placeholder: 'X', disabled: true } },
    {
      name: 'x',
      type: 'select',
      options,
      props: { placeholder: 'X', disabled: true },
    },
  ];
  void fields;
});

test('inputs and selects accept their other HTML attributes', () => {
  const fields: FieldProps<Values>[] = [
    {
      name: 'x',
      type: 'text',
      props: {
        autoComplete: 'off',
        maxLength: 5,
        readOnly: true,
        'aria-label': 'X',
        onFocus: () => {},
      },
    },
    { name: 'x', type: 'file', props: { multiple: true, accept: 'image/*' } },
    {
      name: 'x',
      type: 'select',
      options,
      props: { autoFocus: true, required: true, onFocus: () => {} },
    },
  ];
  void fields;
});

test('attributes the library manages are rejected', () => {
  const fields: FieldProps<Values>[] = [
    // @ts-expect-error
    { name: 'x', type: 'text', props: { name: 'y' } },
    // @ts-expect-error
    { name: 'x', type: 'text', props: { id: 'y' } },
    // @ts-expect-error
    { name: 'x', type: 'text', props: { type: 'number' } },
    // @ts-expect-error
    { name: 'x', type: 'text', props: { value: 'y' } },
    // @ts-expect-error
    { name: 'x', type: 'text', props: { defaultValue: 'y' } },
    // @ts-expect-error
    { name: 'x', type: 'checkbox', props: { checked: true } },
    // @ts-expect-error
    { name: 'x', type: 'checkbox', props: { defaultChecked: true } },
    // @ts-expect-error
    { name: 'x', type: 'text', props: { onChange: () => {} } },
    // @ts-expect-error
    { name: 'x', type: 'text', props: { onBlur: () => {} } },
    // @ts-expect-error
    { name: 'x', type: 'text', props: { className: 'y' } },
    // @ts-expect-error
    { name: 'x', type: 'select', options, props: { multiple: true } },
    // @ts-expect-error
    { name: 'x', type: 'select', options, props: { value: 'a' } },
    // @ts-expect-error
    { name: 'x', type: 'select', options, props: { onChange: () => {} } },
    // @ts-expect-error
    { name: 'x', type: 'select', options, props: { children: null } },
  ];
  void fields;
});
