import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { Form } from '../src';

const renderField = (
  type: 'text' | 'email' | 'number',
  preprocessor: (value: string | number) => string | number,
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
