import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Form } from '../src';

test('a validation name without a validator object logs a warning and treats the field as valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<Form fields={[{ name: 'email', type: 'email', label: 'Email', validation: 'required' }]} onSubmit={onSubmit} submitText="Send"/>);

    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(warn).toHaveBeenCalledWith("Validation 'required' does not exists in form validator object");
    warn.mockRestore();
});
