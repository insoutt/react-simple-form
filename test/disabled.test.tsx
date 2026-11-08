import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Form } from '../src';
import { FieldProps } from '../src/utils/types';

const field = (
  type: 'text' | 'select',
  disabled: boolean,
): FieldProps<{ x: string }> =>
  type === 'select'
    ? {
        name: 'x',
        type,
        label: 'X',
        options: [{ value: 'a', text: 'A' }],
        props: { disabled },
      }
    : { name: 'x', type, label: 'X', props: { disabled } };

test.each(['text', 'select'] as const)(
  'a busy form disables a %s even when its props set disabled: false',
  (type) => {
    render(<Form fields={[field(type, false)]} isLoading />);

    expect((screen.getByLabelText('X') as HTMLInputElement).disabled).toBe(
      true,
    );
  },
);

test.each(['text', 'select'] as const)(
  'a %s with props disabled: true stays disabled while the form is idle',
  (type) => {
    render(<Form fields={[field(type, true)]} />);

    expect((screen.getByLabelText('X') as HTMLInputElement).disabled).toBe(
      true,
    );
  },
);

test.each([{ disabled: false }, undefined])(
  'a required field mounted while loading still fails validation once enabled (props: %o)',
  async (props) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const required = (value: string | number) =>
      value.toString().length > 0 || 'Required';
    const Host = ({ isLoading }: { isLoading: boolean }) => (
      <Form
        fields={[
          { name: 'x', type: 'text', label: 'X', validation: required, props },
        ]}
        isLoading={isLoading}
        onSubmit={onSubmit}
        submitText="Send"
      />
    );
    const { rerender } = render(<Host isLoading />);
    rerender(<Host isLoading={false} />);

    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe('Required'),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  },
);

test.each([false, true])(
  'fields disabled through props skip validation and submit without their value (validateOnSubmit: %s)',
  async (validateOnSubmit) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Form
        fields={[
          {
            name: 'x',
            type: 'text',
            label: 'X',
            props: { disabled: true },
            validation: (v) => !!v || 'Required',
          },
          {
            name: 's',
            type: 'select',
            label: 'S',
            options: [{ value: 'a', text: 'A' }],
            props: { disabled: true },
            validation: (v) => !!v || 'Required',
          },
          {
            name: 'c',
            type: 'checkbox',
            label: 'C',
            props: { disabled: true },
            validation: (v) => (v as unknown) === true || 'Must check',
          },
          { name: 'y', type: 'text', label: 'Y' },
        ]}
        validateOnSubmit={validateOnSubmit}
        onSubmit={onSubmit}
        submitText="Send"
      />,
    );

    await user.type(screen.getByLabelText('Y'), 'q');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ y: 'q' });
  },
);

test('a field disabled through props still submits its default value', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(
    <Form
      fields={[
        {
          name: 'x',
          type: 'text',
          label: 'X',
          props: { disabled: true },
          validation: (v) => !!v || 'Required',
        },
      ]}
      defaultValues={{ x: 'd' }}
      onSubmit={onSubmit}
      submitText="Send"
    />,
  );

  await user.click(screen.getByRole('button', { name: 'Send' }));

  await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  expect(onSubmit.mock.calls[0][0]).toMatchObject({ x: 'd' });
});
