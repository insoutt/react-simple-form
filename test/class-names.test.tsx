import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Form } from '../src';
import { FieldProps } from '../src/utils/types';

const classes = {
  className: 'my-control',
  groupClassName: 'mb-0',
  labelClassName: 'my-label',
};

test.each<FieldProps<{ x: string }>>([
  { name: 'x', type: 'text', label: 'X', ...classes },
  {
    name: 'x',
    type: 'select',
    label: 'X',
    options: [{ value: 'a', text: 'A' }],
    ...classes,
  },
])(
  'per-field class names override the form-level classNames ($type)',
  (field) => {
    render(
      <Form
        fields={[field]}
        classNames={{
          input: 'form-input',
          select: 'form-select',
          group: 'form-group-x',
          label: 'form-label-x',
        }}
      />,
    );

    const control = screen.getByLabelText('X');
    expect(control.classList).toContain('my-control');
    expect(control.classList).not.toContain('form-input');
    expect(control.classList).not.toContain('form-select');
    expect(control.parentElement?.className).toBe('mb-0');
    expect(screen.getByText('X').className).toBe('my-label');
  },
);

test('per-field class names override the defaults without form-level classNames', () => {
  render(
    <Form fields={[{ name: 'x', type: 'text', label: 'X', ...classes }]} />,
  );

  const control = screen.getByLabelText('X');
  expect(control.classList).toContain('my-control');
  expect(control.classList).not.toContain('form-control');
  expect(control.parentElement?.className).toBe('mb-0');
  expect(screen.getByText('X').className).toBe('my-label');
});
