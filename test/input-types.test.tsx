import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Form } from '../src';

test('a checkbox toggles on and off and submits a boolean', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form fields={[{ name: 'agree', type: 'checkbox', label: 'Agree' }]} onSubmit={onSubmit} submitText="Send"/>);

    const checkbox = screen.getByLabelText('Agree') as HTMLInputElement;
    await user.click(checkbox);
    expect(checkbox.checked).toBe(true);
    await user.click(checkbox);
    expect(checkbox.checked).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({ agree: false });

    await user.click(checkbox);
    expect(checkbox.checked).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onSubmit.mock.calls[1][0]).toEqual({ agree: true });
});

test('a file input keeps its selection and submits the selected files', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form fields={[{ name: 'avatar', type: 'file', label: 'Avatar' }]} onSubmit={onSubmit} submitText="Send"/>);

    const input = screen.getByLabelText('Avatar') as HTMLInputElement;
    const file = new File(['png'], 'x.png', { type: 'image/png' });
    await user.upload(input, file);
    expect(input.files?.[0]).toBe(file);

    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const avatar = onSubmit.mock.calls[0][0].avatar;
    expect(typeof avatar).not.toBe('string');
    expect(avatar[0]).toBe(file);
    expect(input.files?.[0]).toBe(file);
});

test.each(['preprocessor', 'preprocessors'] as const)('a checkbox %s receives the checked boolean and its result is stored', async (via) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const preprocessor = vi.fn((value: unknown) => value) as any;
    render(<Form
        fields={[{ name: 'agree', type: 'checkbox', label: 'Agree', ...(via === 'preprocessor' ? { preprocessor } : {}) }]}
        preprocessors={via === 'preprocessors' ? { agree: preprocessor } : undefined}
        onSubmit={onSubmit}
        submitText="Send"
    />);

    await user.click(screen.getByLabelText('Agree'));
    expect(preprocessor).toHaveBeenLastCalledWith(true, expect.anything());

    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ agree: true }));
});

test('under validateOnSubmit a file change after a failed submit runs its validator once', async () => {
    const user = userEvent.setup();
    const validation = vi.fn((value: any) => (value && value.length > 0) || 'Required');
    render(<Form fields={[{ name: 'avatar', type: 'file', label: 'Avatar', validation }]} validateOnSubmit onSubmit={vi.fn()} submitText="Send"/>);

    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('Required')).toBeTruthy();

    validation.mockClear();
    await user.upload(screen.getByLabelText('Avatar'), new File(['png'], 'x.png', { type: 'image/png' }));
    await waitFor(() => expect(screen.queryByText('Required')).toBeNull());
    expect(validation).toHaveBeenCalledTimes(1);
});
