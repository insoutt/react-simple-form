import { StrictMode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Form } from '../src';
import { FieldProps } from '../src/utils/types';

type Values = { kind: string; detail?: string };

const fields: FieldProps<Values>[] = [{
    name: 'kind',
    type: 'select',
    label: 'Kind',
    options: [
        { value: 'a', text: 'A', fields: [{ name: 'detail', type: 'text', label: 'Detail' }] },
        { value: 'b', text: 'B' },
    ],
}];

test('Clear restores default values under StrictMode', async () => {
    const user = userEvent.setup();
    render(<StrictMode>
        <Form fields={[{ name: 'name', type: 'text', label: 'Name' }]} defaultValues={{ name: 'John' }} clearText="Clear"/>
    </StrictMode>);

    const input = screen.getByLabelText('Name') as HTMLInputElement;
    expect(input.value).toBe('John');
    await user.clear(input);
    await user.type(input, 'Jane');
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    await waitFor(() => expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('John'));
});

test.each([false, true])('a select sub-field hidden by changing the select is not submitted, before and after Clear (StrictMode=%s)', async (strict) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const form = <Form<Values> fields={fields} defaultValues={{ kind: 'a', detail: 'foo' }} onSubmit={onSubmit} submitText="Send" clearText="Clear"/>;
    render(strict ? <StrictMode>{form}</StrictMode> : form);

    expect((screen.getByLabelText('Detail') as HTMLInputElement).value).toBe('foo');

    await user.selectOptions(screen.getByLabelText('Kind'), 'b');
    expect(screen.queryByLabelText('Detail')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({ kind: 'b' });

    // Clear brings back the default option, so the sub-field shows its default again.
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    await waitFor(() => expect((screen.getByLabelText('Detail') as HTMLInputElement).value).toBe('foo'));
    expect((screen.getByLabelText('Kind') as HTMLSelectElement).value).toBe('a');

    // Hiding it again after Clear still keeps it out of the payload.
    await user.selectOptions(screen.getByLabelText('Kind'), 'b');
    expect(screen.queryByLabelText('Detail')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onSubmit.mock.calls[1][0]).toEqual({ kind: 'b' });
});
