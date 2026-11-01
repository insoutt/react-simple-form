import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Form } from '../src';

const expectFormUsable = async () => {
    const button = screen.getByRole('button', { name: /Send|Sending/ }) as HTMLButtonElement;
    const input = screen.getByLabelText('Name') as HTMLInputElement;
    await waitFor(() => {
        expect(button.textContent).toBe('Send');
        expect(button.disabled).toBe(false);
        expect(input.disabled).toBe(false);
        expect(input.className).not.toContain('validating');
    });
};

test('beforeSubmit throwing leaves the form usable and skips onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const beforeSubmit = vi.fn(async () => { throw new Error('boom'); });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<Form
        fields={[{ name: 'name', type: 'text', label: 'Name' }]}
        defaultValues={{ name: 'John' }}
        beforeSubmit={beforeSubmit}
        onSubmit={onSubmit}
        submitText="Send"
        loadingText="Sending"
    />);

    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(beforeSubmit).toHaveBeenCalled());

    await expectFormUsable();
    expect(onSubmit).not.toHaveBeenCalled();
    warn.mockRestore();
});

test.each([false, true])('a rejecting async validator does not leave the form stuck submitting (validateOnSubmit=%s)', async (validateOnSubmit) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const validation = vi.fn(async () => { throw new Error('network down'); });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<Form
        fields={[{ name: 'name', type: 'text', label: 'Name', validation }]}
        defaultValues={{ name: 'John' }}
        validateOnSubmit={validateOnSubmit}
        onSubmit={onSubmit}
        submitText="Send"
        loadingText="Sending"
    />);

    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(validation).toHaveBeenCalled());

    await expectFormUsable();
    expect(onSubmit).not.toHaveBeenCalled();
    warn.mockRestore();
});
