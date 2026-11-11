import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import { expect, test, vi } from 'vitest';
import { Form } from '../src';

const required = (value: string | number) =>
  value.toString().length > 0 || 'Required';
const classes = (label: string) => screen.getByLabelText(label).classList;
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

test('an input gets -valid once a change validated it, not for other fields, and loses it on error and Clear', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(
    <Form
      fields={[
        { name: 'x', type: 'text', label: 'X', validation: required },
        { name: 'y', type: 'text', label: 'Y' },
      ]}
      defaultValues={{ x: 'a' }}
      onSubmit={onSubmit}
      submitText="Send"
      clearText="Clear"
    />,
  );
  await settle();
  expect(classes('X')).not.toContain('form-control-valid');
  expect(classes('Y')).not.toContain('form-control-valid');

  await user.clear(screen.getByLabelText('X'));
  await waitFor(() => expect(classes('X')).toContain('form-control-error'));
  expect(classes('X')).not.toContain('form-control-valid');

  await user.type(screen.getByLabelText('X'), 'b');
  await waitFor(() => expect(classes('X')).toContain('form-control-valid'));
  expect(classes('X')).not.toContain('form-control-error');
  expect(classes('Y')).not.toContain('form-control-valid');

  // Focusing and leaving a field does not validate it
  await user.click(screen.getByLabelText('Y'));
  await user.tab();
  await settle();
  expect(classes('Y')).not.toContain('form-control-valid');

  await user.click(screen.getByRole('button', { name: 'Clear' }));
  await settle();
  expect(classes('X')).not.toContain('form-control-valid');
  expect(classes('Y')).not.toContain('form-control-valid');

  await user.click(screen.getByRole('button', { name: 'Send' }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(classes('X')).toContain('form-control-valid'));
  expect(classes('Y')).toContain('form-control-valid');
});

test.each([
  { name: 'a failed value', defaultX: '', typed: 'a{Backspace}' },
  { name: 'a value that passed before', defaultX: 'a', typed: 'b{Backspace}' },
])(
  'after Clear an input holding $name shows no -valid until validated again',
  async ({ defaultX, typed }) => {
    const user = userEvent.setup();
    render(
      <Form
        fields={[
          { name: 'x', type: 'text', label: 'X', validation: required },
          { name: 'y', type: 'text', label: 'Y' },
        ]}
        defaultValues={{ x: defaultX }}
        clearText="Clear"
      />,
    );

    await user.type(screen.getByLabelText('X'), typed);
    await user.type(screen.getByLabelText('Y'), 'z');
    await settle();
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    await settle();

    expect((screen.getByLabelText('X') as HTMLInputElement).value).toBe(
      defaultX,
    );
    expect(classes('X')).not.toContain('form-control-valid');
  },
);

test('a failed value shows no -valid once its error is cleared without validating it', async () => {
  const user = userEvent.setup();
  const ClearErrors = () => {
    const { clearErrors } = useFormContext();
    return (
      <button type="button" onClick={() => clearErrors('x')}>
        Clear errors
      </button>
    );
  };
  render(
    <Form
      fields={[{ name: 'x', type: 'text', label: 'X', validation: required }]}
    >
      <ClearErrors />
    </Form>,
  );

  await user.type(screen.getByLabelText('X'), 'a{Backspace}');
  await waitFor(() => expect(classes('X')).toContain('form-control-error'));
  await user.click(screen.getByRole('button', { name: 'Clear errors' }));
  await settle();

  expect(classes('X')).not.toContain('form-control-error');
  expect(classes('X')).not.toContain('form-control-valid');
});

test('a select holding a failed value shows no -valid once its error is cleared without validating it', async () => {
  const user = userEvent.setup();
  const ClearErrors = () => {
    const { clearErrors } = useFormContext();
    return (
      <button type="button" onClick={() => clearErrors('s')}>
        Clear errors
      </button>
    );
  };
  render(
    <Form
      fields={[
        {
          name: 's',
          type: 'select',
          label: 'S',
          validation: required,
          options: [{ value: 'a', text: 'A' }],
        },
      ]}
    >
      <ClearErrors />
    </Form>,
  );

  await user.selectOptions(screen.getByLabelText('S'), 'a');
  await user.selectOptions(screen.getByLabelText('S'), '');
  await waitFor(() => expect(classes('S')).toContain('form-control-error'));
  await user.click(screen.getByRole('button', { name: 'Clear errors' }));
  await settle();

  expect(classes('S')).not.toContain('form-control-error');
  expect(classes('S')).not.toContain('form-control-valid');
});

test('a select shows -valid and its error right after a change, and loses -valid on Clear', async () => {
  const user = userEvent.setup();
  render(
    <Form
      fields={[
        {
          name: 's',
          type: 'select',
          label: 'S',
          validation: required,
          options: [{ value: 'a', text: 'A' }],
        },
      ]}
      clearText="Clear"
    />,
  );

  await user.selectOptions(screen.getByLabelText('S'), 'a');
  await waitFor(() => expect(classes('S')).toContain('form-control-valid'));

  await user.selectOptions(screen.getByLabelText('S'), '');
  await waitFor(() =>
    expect(screen.getByRole('alert').textContent).toBe('Required'),
  );
  expect(classes('S')).toContain('form-control-error');
  expect(classes('S')).not.toContain('form-control-valid');

  await user.selectOptions(screen.getByLabelText('S'), 'a');
  await waitFor(() => expect(classes('S')).toContain('form-control-valid'));
  expect(screen.queryByRole('alert')).toBeNull();

  await user.click(screen.getByRole('button', { name: 'Clear' }));
  await settle();
  expect(classes('S')).not.toContain('form-control-valid');
});

test('under validateOnSubmit a select change shows no error before the first submit', async () => {
  const user = userEvent.setup();
  render(
    <Form
      fields={[
        {
          name: 's',
          type: 'select',
          label: 'S',
          validation: required,
          options: [{ value: 'a', text: 'A' }],
        },
      ]}
      validateOnSubmit
    />,
  );

  await user.selectOptions(screen.getByLabelText('S'), 'a');
  await user.selectOptions(screen.getByLabelText('S'), '');
  await settle();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(classes('S')).not.toContain('form-control-error');
});

test('under validateOnSubmit -valid never appears, before or after a submit', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(
    <Form
      fields={[{ name: 'x', type: 'text', label: 'X', validation: required }]}
      validateOnSubmit
      onSubmit={onSubmit}
      submitText="Send"
    />,
  );

  await user.type(screen.getByLabelText('X'), 'a');
  await settle();
  expect(classes('X')).not.toContain('form-control-valid');

  await user.click(screen.getByRole('button', { name: 'Send' }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  await user.type(screen.getByLabelText('X'), 'b');
  await settle();
  expect(classes('X')).not.toContain('form-control-valid');
});
