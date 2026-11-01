import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Form } from '../src';
import { FieldProps } from '../src/utils/types';

const required = (value: string | number) => value.toString().length > 0 || 'Required field';

test.each<FieldProps<{ x: string }>>([
    { name: 'x', type: 'text', label: 'X', validation: required },
    { name: 'x', type: 'select', label: 'X', validation: required, options: [{ value: 'a', text: 'A' }] },
])('under validateOnSubmit an invalid $type never reaches beforeSubmit or onSubmit', async (field) => {
    const user = userEvent.setup();
    const beforeSubmit = vi.fn(async () => true);
    const onSubmit = vi.fn();
    render(<Form fields={[field]} validateOnSubmit beforeSubmit={beforeSubmit} onSubmit={onSubmit} submitText="Send"/>);

    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Required field'));
    await waitFor(() => expect((screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement).disabled).toBe(false));

    expect(beforeSubmit).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();

    const control = screen.getByLabelText('X');
    field.type === 'select' ? await user.selectOptions(control, 'a') : await user.type(control, 'a');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ x: 'a' }));
    expect(beforeSubmit).toHaveBeenCalledWith({ x: 'a' });
});
