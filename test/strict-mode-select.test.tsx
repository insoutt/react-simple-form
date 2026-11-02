import { render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { expect, test, vi } from 'vitest';
import { Form } from '../src';

// RHF only runs the first registered field's validate synchronously, so the select goes first.
// React dedupes this warning per module, so each component gets its own test file.
test('a form with a select first in StrictMode logs no cross-component update warning while registering', async () => {
  const error = vi.spyOn(console, 'error');
  const validation = vi.fn(async () => true);

  render(
    <StrictMode>
      <Form
        fields={[
          {
            name: 'kind',
            type: 'select',
            label: 'Kind',
            validation: () => true,
            options: [
              { value: 1, text: 'One' },
              { value: 2, text: 'Two' },
            ],
          },
          { name: 'name', type: 'text', label: 'Name', validation },
          {
            name: 'email',
            type: 'text',
            label: 'Email',
            validation: () => true,
          },
        ]}
        defaultValues={{ name: 'John', email: 'john@example.com', kind: 1 }}
      />
    </StrictMode>,
  );

  await waitFor(() => expect(validation).toHaveBeenCalled());
  await waitFor(() =>
    expect(screen.getByLabelText('Name').className).not.toContain('validating'),
  );

  const messages = error.mock.calls.map((args) => String(args[0]));
  expect(
    messages.filter((message) => message.includes('Cannot update a component')),
  ).toEqual([]);
  error.mockRestore();
});
