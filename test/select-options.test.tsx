import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { Form } from '../src';
import { FieldProps } from '../src/utils/types';

type Values = { kind: number; detail?: string };

const fields: FieldProps<Values>[] = [
  {
    name: 'kind',
    type: 'select',
    label: 'Kind',
    options: [
      {
        value: 1,
        text: 'One',
        fields: [{ name: 'detail', type: 'text', label: 'Detail' }],
      },
      { value: 2, text: 'Two' },
    ],
  },
];

test('a numeric option value shows its sub-fields when selected', async () => {
  const user = userEvent.setup();
  render(<Form<Values> fields={fields} />);

  expect(screen.queryByLabelText('Detail')).toBeNull();
  await user.selectOptions(screen.getByLabelText('Kind'), '1');
  expect(screen.getByLabelText('Detail')).not.toBeNull();
  await user.selectOptions(screen.getByLabelText('Kind'), '2');
  expect(screen.queryByLabelText('Detail')).toBeNull();
});

test('a numeric default value shows its option sub-fields', () => {
  render(<Form<Values> fields={fields} defaultValues={{ kind: 1 }} />);

  expect(screen.getByLabelText('Detail')).not.toBeNull();
});
