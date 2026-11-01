import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Form } from '../src';
import { FieldProps } from '../src/utils/types';

const clearButton = () => screen.queryByRole('button', { name: 'Clear' });

test('Clear hides again once fields without defaults are emptied', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form
        fields={[
            { name: 'email', type: 'email', label: 'Email' },
            { name: 'password', type: 'password', label: 'Password' },
            { name: 'agree', type: 'checkbox', label: 'Agree' },
        ]}
        onSubmit={onSubmit}
        submitText="Send"
        clearText="Clear"
    />);

    expect(clearButton()).toBeNull();
    await user.type(screen.getByLabelText('Email'), 'a');
    expect(clearButton()).not.toBeNull();
    await user.clear(screen.getByLabelText('Email'));
    await waitFor(() => expect(clearButton()).toBeNull());

    await user.click(screen.getByLabelText('Agree'));
    expect(clearButton()).not.toBeNull();
    await user.click(screen.getByLabelText('Agree'));
    await waitFor(() => expect(clearButton()).toBeNull());

    // No new keys in the payload.
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({ email: '', password: '', agree: false });
});

type Values = { name: string; kind: string; detail?: string };

test('Clear hides again with partial defaults once a select sub-field is emptied and a defaulted field is restored', async () => {
    const user = userEvent.setup();
    const fields: FieldProps<Values>[] = [
        { name: 'name', type: 'text', label: 'Name' },
        {
            name: 'kind',
            type: 'select',
            label: 'Kind',
            options: [{ value: 'a', text: 'A', fields: [{ name: 'detail', type: 'text', label: 'Detail' }] }],
        },
    ];
    render(<Form<Values> fields={fields} defaultValues={{ name: 'John', kind: 'a' }} clearText="Clear"/>);

    await user.type(screen.getByLabelText('Detail'), 'x');
    expect(clearButton()).not.toBeNull();
    await user.clear(screen.getByLabelText('Detail'));
    await waitFor(() => expect(clearButton()).toBeNull());

    await user.type(screen.getByLabelText('Name'), '!');
    expect(clearButton()).not.toBeNull();
    await user.type(screen.getByLabelText('Name'), '{Backspace}');
    await waitFor(() => expect(clearButton()).toBeNull());
});

test('a number value without default counts as dirty and an untouched file input counts as clean', async () => {
    const user = userEvent.setup();
    render(<Form
        fields={[
            { name: 'avatar', type: 'file', label: 'Avatar' },
            { name: 'name', type: 'text', label: 'Name' },
            { name: 'amount', type: 'text', label: 'Amount', preprocessor: (value) => Number(value) },
        ]}
        clearText="Clear"
    />);

    expect(clearButton()).toBeNull();
    await user.type(screen.getByLabelText('Name'), 'a');
    expect(clearButton()).not.toBeNull();
    await user.clear(screen.getByLabelText('Name'));
    await waitFor(() => expect(clearButton()).toBeNull());

    await user.type(screen.getByLabelText('Amount'), '0');
    expect(clearButton()).not.toBeNull();
});
