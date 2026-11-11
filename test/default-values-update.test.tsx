import {
  StrictMode,
  Suspense,
  startTransition,
  useState,
  type ReactNode,
} from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Form } from '../src';
import { FieldProps } from '../src/utils/types';

type Values = { name: string; kind: string; detail?: string };

const fields: FieldProps<Values>[] = [
  { name: 'name', type: 'text', label: 'Name' },
  {
    name: 'kind',
    type: 'select',
    label: 'Kind',
    options: [
      {
        value: 'a',
        text: 'A',
        fields: [{ name: 'detail', type: 'text', label: 'Detail' }],
      },
      { value: 'b', text: 'B' },
    ],
  },
];

const value = (label: string) =>
  (screen.getByLabelText(label) as HTMLInputElement).value;
const clearButton = () => screen.queryByRole('button', { name: 'Clear' });

const Host = ({
  defaultValues,
  isLoading,
  submitText,
}: {
  defaultValues?: Partial<Values>;
  isLoading?: boolean;
  submitText?: string;
}) => (
  <Form<Values>
    fields={fields}
    defaultValues={defaultValues}
    isLoading={isLoading}
    submitText={submitText}
    clearText="Clear"
  />
);

test.each([false, true])(
  'new defaultValues after mount reset the form and Clear restores them (StrictMode=%s)',
  async (strict) => {
    const user = userEvent.setup();
    const wrap = (node: ReactNode) =>
      strict ? <StrictMode>{node}</StrictMode> : node;
    const { rerender } = render(
      wrap(<Host defaultValues={{ name: 'John', kind: 'a', detail: 'foo' }} />),
    );
    expect(value('Name')).toBe('John');

    rerender(
      wrap(<Host defaultValues={{ name: 'Jane', kind: 'a', detail: 'bar' }} />),
    );
    await waitFor(() => expect(value('Name')).toBe('Jane'));
    expect(value('Detail')).toBe('bar');
    expect(clearButton()).toBeNull();

    await user.type(screen.getByLabelText('Name'), '!');
    await user.selectOptions(screen.getByLabelText('Kind'), 'b');
    expect(screen.queryByLabelText('Detail')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    await waitFor(() => expect(value('Name')).toBe('Jane'));
    expect(value('Kind')).toBe('a');
    expect(value('Detail')).toBe('bar');
    await waitFor(() => expect(clearButton()).toBeNull());
  },
);

test('a select sub-field hidden when defaultValues change shows the new default once selected', async () => {
  const user = userEvent.setup();
  const { rerender } = render(
    <Host defaultValues={{ name: 'John', kind: 'a', detail: 'foo' }} />,
  );

  rerender(<Host defaultValues={{ name: 'Jane', kind: 'b', detail: 'bar' }} />);
  await waitFor(() => expect(value('Kind')).toBe('b'));
  expect(screen.queryByLabelText('Detail')).toBeNull();

  await user.selectOptions(screen.getByLabelText('Kind'), 'a');
  expect(value('Detail')).toBe('bar');
});

test('defaultValues loaded while isLoading show once the form is enabled', async () => {
  const { rerender } = render(<Host isLoading />);
  expect(value('Name')).toBe('');

  rerender(<Host defaultValues={{ name: 'John', kind: 'a', detail: 'foo' }} />);
  await waitFor(() => expect(value('Name')).toBe('John'));
  expect(value('Detail')).toBe('foo');
  expect((screen.getByLabelText('Name') as HTMLInputElement).disabled).toBe(
    false,
  );
  expect(clearButton()).toBeNull();
});

test('re-rendering with equal but new defaultValues keeps user edits', async () => {
  const user = userEvent.setup();
  const { rerender } = render(
    <Host defaultValues={{ name: 'John', kind: 'a' }} submitText="Send" />,
  );
  await user.type(screen.getByLabelText('Name'), '!');
  await user.type(screen.getByLabelText('Detail'), 'x');

  rerender(
    <Host defaultValues={{ name: 'John', kind: 'a' }} submitText="Go" />,
  );
  await screen.findByRole('button', { name: 'Go' });

  expect(value('Name')).toBe('John!');
  expect(value('Detail')).toBe('x');
  expect(clearButton()).not.toBeNull();
});

type Contact = { name?: string; phone?: string };

test.each([false, true])(
  'fields missing from new defaultValues are emptied, also for empty defaults, and Clear restores the new ones (StrictMode=%s)',
  async (strict) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const ContactForm = ({ defaults }: { defaults?: Contact }) => {
      const form = (
        <Form<Contact>
          fields={[
            { name: 'name', type: 'text', label: 'Name' },
            { name: 'phone', type: 'text', label: 'Phone' },
          ]}
          defaultValues={defaults}
          onSubmit={onSubmit}
          submitText="Send"
          clearText="Clear"
        />
      );
      return strict ? <StrictMode>{form}</StrictMode> : form;
    };
    const { rerender } = render(
      <ContactForm defaults={{ name: 'Alice', phone: '123' }} />,
    );
    await user.clear(screen.getByLabelText('Phone'));
    await user.type(screen.getByLabelText('Phone'), '999');
    await waitFor(() =>
      expect(screen.getByLabelText('Phone').classList).toContain(
        'form-control-valid',
      ),
    );

    rerender(<ContactForm defaults={{ name: 'Bob' }} />);
    await waitFor(() => expect(value('Name')).toBe('Bob'));
    expect(value('Phone')).toBe('');
    expect(screen.getByLabelText('Phone').classList).not.toContain(
      'form-control-valid',
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'Bob', phone: '' });

    await user.type(screen.getByLabelText('Phone'), '5');
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    await waitFor(() => expect(value('Phone')).toBe(''));
    expect(value('Name')).toBe('Bob');

    rerender(<ContactForm defaults={{}} />);
    await waitFor(() => expect(value('Name')).toBe(''));
    expect(value('Phone')).toBe('');
  },
);

test('new defaultValues passed while a submit runs apply once it has finished', async () => {
  const user = userEvent.setup();
  let finishAfterSubmit = () => {};
  const afterSubmit = vi.fn(
    () => new Promise<void>((resolve) => (finishAfterSubmit = resolve)),
  );
  const Host = () => {
    const [record, setRecord] = useState<Contact>({ name: 'Alice' });
    return (
      <Form<Contact>
        fields={[{ name: 'name', type: 'text', label: 'Name' }]}
        defaultValues={record}
        onSubmit={async (values) => setRecord({ name: values.name + '!' })}
        afterSubmit={afterSubmit}
        submitText="Send"
        loadingText="Sending"
      />
    );
  };
  render(<Host />);
  await user.type(screen.getByLabelText('Name'), 'x');

  await user.click(screen.getByRole('button', { name: 'Send' }));
  await waitFor(() => expect(afterSubmit).toHaveBeenCalledTimes(1));
  await new Promise((r) => setTimeout(r, 20));

  // Still submitting: the form stays busy and keeps the submitted value
  expect(screen.getByRole('button', { name: 'Sending' })).not.toBeNull();
  expect((screen.getByLabelText('Name') as HTMLInputElement).disabled).toBe(
    true,
  );
  expect(value('Name')).toBe('Alicex');

  finishAfterSubmit();
  await waitFor(() => expect(value('Name')).toBe('Alicex!'));
  expect(screen.getByRole('button', { name: 'Send' })).not.toBeNull();
  expect((screen.getByLabelText('Name') as HTMLInputElement).disabled).toBe(
    false,
  );
  expect(screen.getByLabelText('Name').classList).not.toContain(
    'form-control-valid',
  );
});

test('with two overlapping submits, new defaultValues wait until both have finished', async () => {
  const user = userEvent.setup();
  const finish: Array<() => void> = [];
  const afterSubmit = vi.fn(
    () => new Promise<void>((resolve) => finish.push(resolve)),
  );
  const Host = () => {
    const [record, setRecord] = useState<Contact>({ name: 'Alice' });
    return (
      <Form<Contact>
        fields={[{ name: 'name', type: 'text', label: 'Name' }]}
        defaultValues={record}
        onSubmit={async (values) => setRecord({ name: values.name + '!' })}
        afterSubmit={afterSubmit}
      >
        {(submit) => (
          <button type="button" onClick={submit}>
            Go
          </button>
        )}
      </Form>
    );
  };
  render(<Host />);
  await user.type(screen.getByLabelText('Name'), 'x');

  await user.click(screen.getByRole('button', { name: 'Go' }));
  await user.click(screen.getByRole('button', { name: 'Go' }));
  await waitFor(() => expect(afterSubmit).toHaveBeenCalledTimes(2));

  finish[0]!();
  await new Promise((r) => setTimeout(r, 20));
  expect(value('Name')).toBe('Alicex');

  finish[1]!();
  await waitFor(() => expect(value('Name')).toBe('Alicex!'));
});

test('new defaultValues from a suspended transition do not remount the form during a submit', async () => {
  const user = userEvent.setup();
  let finishAfterSubmit = () => {};
  const afterSubmit = vi.fn(
    () => new Promise<void>((resolve) => (finishAfterSubmit = resolve)),
  );
  const never = new Promise(() => {});
  const Suspender = () => {
    throw never;
  };
  const Host = () => {
    const [record, setRecord] = useState<Contact>({ name: 'Alice' });
    const [suspend, setSuspend] = useState(false);
    return (
      <>
        <Form<Contact>
          fields={[{ name: 'name', type: 'text', label: 'Name' }]}
          defaultValues={record}
          afterSubmit={afterSubmit}
          submitText="Send"
          loadingText="Sending"
        />
        <button
          type="button"
          onClick={() =>
            startTransition(() => {
              setRecord({ name: 'Bob' });
              setSuspend(true);
            })
          }
        >
          Load
        </button>
        <Suspense fallback={<p>Loading</p>}>
          {suspend && <Suspender />}
        </Suspense>
      </>
    );
  };
  render(<Host />);
  await user.type(screen.getByLabelText('Name'), 'x');

  await user.click(screen.getByRole('button', { name: 'Load' }));
  await new Promise((r) => setTimeout(r, 20));
  // The transition is still pending, so the form keeps showing the old values
  expect(value('Name')).toBe('Alicex');
  expect(screen.queryByText('Loading')).toBeNull();

  await user.click(screen.getByRole('button', { name: 'Send' }));
  await waitFor(() => expect(afterSubmit).toHaveBeenCalledTimes(1));
  await new Promise((r) => setTimeout(r, 20));

  expect(value('Name')).toBe('Alicex');
  expect(screen.getByRole('button', { name: 'Sending' })).not.toBeNull();
  finishAfterSubmit();
});
