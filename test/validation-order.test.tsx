import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { Form } from '../src';
import { FieldProps } from '../src/utils/types';

type Result = string | boolean;

// Each call stays pending until the test resolves the calls for its value
const controlledValidator = () => {
  const pending = new Map<string, Array<(result: Result) => void>>();
  const validation = (value: string | number) =>
    new Promise<Result>((resolve) => {
      const key = String(value);
      pending.set(key, [...(pending.get(key) ?? []), resolve]);
    });
  const resolve = (value: string, result: Result) => {
    pending.get(value)?.forEach((done) => done(result));
    pending.delete(value);
  };
  const isPending = (value: string) => pending.has(value);
  return { validation, resolve, isPending };
};

const settle = () => new Promise((r) => setTimeout(r, 20));
const classes = () => screen.getByLabelText('X').classList;

const field = (
  type: 'text' | 'select',
  validation: (value: string | number) => Promise<Result>,
): FieldProps<{ x: string }> =>
  type === 'select'
    ? {
        name: 'x',
        type,
        label: 'X',
        validation,
        options: [
          { value: 'a', text: 'A' },
          { value: 'b', text: 'B' },
        ],
      }
    : { name: 'x', type, label: 'X', validation };

const change = async (
  user: ReturnType<typeof userEvent.setup>,
  type: 'text' | 'select',
  value: string,
) =>
  type === 'select'
    ? user.selectOptions(screen.getByLabelText('X'), value)
    : user.type(screen.getByLabelText('X'), value.slice(-1));

test.each(['text', 'select'] as const)(
  'a %s keeps the newest value result when an older call resolves last, and stays -validating until it is in',
  async (type) => {
    const user = userEvent.setup();
    const { validation, resolve, isPending } = controlledValidator();
    render(<Form fields={[field(type, validation)]} />);
    const [first, second] = type === 'select' ? ['a', 'b'] : ['a', 'ab'];

    await change(user, type, first);
    await change(user, type, second);
    await waitFor(() => expect(isPending(second)).toBe(true));
    await waitFor(() => expect(classes()).toContain('form-control-validating'));

    // The newest call fails first, the stale one passes last
    resolve(second, 'Bad');
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe('Bad'),
    );
    resolve(first, true);
    await settle();

    expect(screen.getByRole('alert').textContent).toBe('Bad');
    expect(classes()).toContain('form-control-error');
    expect(classes()).not.toContain('form-control-valid');
    expect(classes()).not.toContain('form-control-validating');
  },
);

test.each(['text', 'select'] as const)(
  'a %s stays -validating while the newest call is pending, even once an older one resolves',
  async (type) => {
    const user = userEvent.setup();
    const { validation, resolve, isPending } = controlledValidator();
    render(<Form fields={[field(type, validation)]} />);
    const [first, second] = type === 'select' ? ['a', 'b'] : ['a', 'ab'];

    await change(user, type, first);
    await change(user, type, second);
    await waitFor(() => expect(isPending(second)).toBe(true));

    resolve(first, 'Stale');
    await settle();
    expect(classes()).toContain('form-control-validating');
    expect(screen.queryByRole('alert')).toBeNull();

    resolve(second, true);
    await waitFor(() =>
      expect(classes()).not.toContain('form-control-validating'),
    );
    expect(classes()).toContain('form-control-valid');
    expect(screen.queryByRole('alert')).toBeNull();
  },
);
