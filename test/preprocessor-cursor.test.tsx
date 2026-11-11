import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { Form, type Preprocessor } from '../src';

const renderField = (
  type: 'text' | 'email' | 'number',
  preprocessor: Preprocessor,
) =>
  render(
    <Form
      fields={[{ name: 'code', type, label: 'Code', preprocessor }]}
      onSubmit={() => {}}
      submitText="Send"
    />,
  );

test('the caret stays after the typed character when a preprocessor changes the value', async () => {
  const user = userEvent.setup();
  renderField('text', (value) => value.toString().toUpperCase());

  const input = screen.getByLabelText('Code') as HTMLInputElement;
  await user.type(input, 'ABCD');
  input.setSelectionRange(1, 1);
  await user.keyboard('x');

  expect(input.value).toBe('AXBCD');
  expect(input.selectionStart).toBe(2);
  expect(input.selectionEnd).toBe(2);
});

test('the caret stays after the typed character when a preprocessor truncates the value', async () => {
  const user = userEvent.setup();
  renderField('text', (value) => value.toString().slice(0, 4));

  const input = screen.getByLabelText('Code') as HTMLInputElement;
  await user.type(input, 'ABCD');
  input.setSelectionRange(1, 1);
  await user.keyboard('x');

  expect(input.value).toBe('AxBC');
  expect(input.selectionStart).toBe(2);
  expect(input.selectionEnd).toBe(2);
});

test.each(['email', 'number'] as const)(
  'a %s input with a changing preprocessor does not throw',
  async (type) => {
    const user = userEvent.setup();
    renderField(type, (value) => value.toString().slice(0, 3));

    const input = screen.getByLabelText('Code') as HTMLInputElement;
    await user.type(input, '1234');

    expect(input.value).toBe('123');
  },
);

// Formats digits as 12-34 and puts the caret after the same digits, skipping the dash
const dashMask: Preprocessor = (value, { from }) => {
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

test('the caret goes where the preprocessor returns it when a mask adds a character', async () => {
  const user = userEvent.setup();
  renderField('text', dashMask);

  const input = screen.getByLabelText('Code') as HTMLInputElement;
  await user.type(input, '123');
  input.setSelectionRange(2, 2);
  await user.keyboard('9');

  expect(input.value).toBe('12-93');
  expect(input.selectionStart).toBe(4);
  expect(input.selectionEnd).toBe(4);
});

test('a preprocessor returning { value } without a selection keeps the caret in place', async () => {
  const user = userEvent.setup();
  renderField('text', (value) => ({ value: value.toString().toUpperCase() }));

  const input = screen.getByLabelText('Code') as HTMLInputElement;
  await user.type(input, 'ABCD');
  input.setSelectionRange(1, 1);
  await user.keyboard('x');

  expect(input.value).toBe('AXBCD');
  expect(input.selectionStart).toBe(2);
  expect(input.selectionEnd).toBe(2);
});

test('a form-level preprocessor can return a selection too', async () => {
  const user = userEvent.setup();
  render(
    <Form
      fields={[{ name: 'code', type: 'text', label: 'Code' }]}
      preprocessors={{ code: dashMask }}
      onSubmit={() => {}}
      submitText="Send"
    />,
  );

  const input = screen.getByLabelText('Code') as HTMLInputElement;
  await user.type(input, '123');
  input.setSelectionRange(2, 2);
  await user.keyboard('9');

  expect(input.value).toBe('12-93');
  expect(input.selectionStart).toBe(4);
  expect(input.selectionEnd).toBe(4);
});
