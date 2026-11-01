import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Form } from '../src';
import { FieldProps } from '../src/utils/types';

const field = (type: 'text' | 'select', disabled: boolean): FieldProps<{ x: string }> => type === 'select'
    ? { name: 'x', type, label: 'X', options: [{ value: 'a', text: 'A' }], props: { disabled } }
    : { name: 'x', type, label: 'X', props: { disabled } };

test.each(['text', 'select'] as const)('a busy form disables a %s even when its props set disabled: false', (type) => {
    render(<Form fields={[field(type, false)]} isLoading/>);

    expect((screen.getByLabelText('X') as HTMLInputElement).disabled).toBe(true);
});

test.each(['text', 'select'] as const)('a %s with props disabled: true stays disabled while the form is idle', (type) => {
    render(<Form fields={[field(type, true)]}/>);

    expect((screen.getByLabelText('X') as HTMLInputElement).disabled).toBe(true);
});

test.each([{ disabled: false }, undefined])('a required field mounted while loading still fails validation once enabled (props: %o)', async (props) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const required = (value: string | number) => value.toString().length > 0 || 'Required';
    const Host = ({ isLoading }: { isLoading: boolean }) => <Form fields={[{ name: 'x', type: 'text', label: 'X', validation: required, props }]} isLoading={isLoading} onSubmit={onSubmit} submitText="Send"/>;
    const { rerender } = render(<Host isLoading/>);
    rerender(<Host isLoading={false}/>);

    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Required'));
    expect(onSubmit).not.toHaveBeenCalled();
});
