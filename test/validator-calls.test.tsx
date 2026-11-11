import { StrictMode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Form } from '../src';

const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

test('typing runs only the typed field validator, once per keystroke, and none at mount', async () => {
  const user = userEvent.setup();
  const validation = vi.fn(async () => true);
  const other = vi.fn(async () => true);
  render(
    <Form
      fields={[
        { name: 'x', type: 'text', label: 'X', validation },
        { name: 'y', type: 'text', label: 'Y', validation: other },
      ]}
    />,
  );
  await settle();
  expect(validation).not.toHaveBeenCalled();
  expect(other).not.toHaveBeenCalled();

  await user.type(screen.getByLabelText('X'), 'abc');
  await settle();

  expect(validation.mock.calls).toEqual([['a'], ['ab'], ['abc']]);
  expect(other).not.toHaveBeenCalled();
});

test.each([false, true])(
  'a select validator runs once per change before and after a submit, none at mount, and its sub-field does not validate when it mounts (StrictMode=%s)',
  async (strict) => {
    const user = userEvent.setup();
    const validation = vi.fn(async () => true);
    const detail = vi.fn(async () => true);
    const onSubmit = vi.fn();
    const form = (
      <Form
        fields={[
          {
            name: 's',
            type: 'select',
            label: 'S',
            validation,
            options: [
              {
                value: 'a',
                text: 'A',
                fields: [
                  {
                    name: 'detail',
                    type: 'text',
                    label: 'Detail',
                    validation: detail,
                  },
                ],
              },
              { value: 'b', text: 'B' },
            ],
          },
        ]}
        onSubmit={onSubmit}
        submitText="Send"
      />
    );
    render(strict ? <StrictMode>{form}</StrictMode> : form);
    await settle();
    expect(validation).not.toHaveBeenCalled();

    await user.selectOptions(screen.getByLabelText('S'), 'a');
    expect(screen.getByLabelText('Detail')).not.toBeNull();
    await user.selectOptions(screen.getByLabelText('S'), 'b');
    expect(screen.queryByLabelText('Detail')).toBeNull();
    await settle();
    expect(validation.mock.calls).toEqual([['a'], ['b']]);
    expect(detail).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    await settle();
    validation.mockClear();

    await user.selectOptions(screen.getByLabelText('S'), 'a');
    await settle();
    expect(validation.mock.calls).toEqual([['a']]);
    expect(detail).not.toHaveBeenCalled();
  },
);
