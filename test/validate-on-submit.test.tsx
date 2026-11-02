import { render, screen, waitFor, within } from '@testing-library/react';
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

test('under validateOnSubmit a submit called outside a React event still validates', async () => {
    const validation = vi.fn(required);
    const beforeSubmit = vi.fn(async () => true);
    const onSubmit = vi.fn();
    let submit = () => {};
    render(<Form fields={[{ name: 'x', type: 'text', label: 'X', validation }]} defaultValues={{ x: '' }} validateOnSubmit beforeSubmit={beforeSubmit} onSubmit={onSubmit}>
        {(formSubmit) => { submit = formSubmit; return <span/>; }}
    </Form>);

    // Outside act and outside any event, as when an app calls submit after an await.
    // jsdom can leave a finished event in window.event, which React would treat as a discrete update.
    const event = vi.spyOn(window, 'event', 'get').mockReturnValue(undefined);
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
    await new Promise<void>(resolve => setTimeout(() => { submit(); resolve(); }, 0));
    await new Promise(resolve => setTimeout(resolve, 50));
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    event.mockRestore();

    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Required field'));
    expect(validation).toHaveBeenCalled();
    expect(beforeSubmit).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
});

test('under validateOnSubmit typing before the first submit runs no validator and shows no error', async () => {
    const user = userEvent.setup();
    const validation = vi.fn((value: string | number) => value.toString().length > 3 || 'Too short');
    render(<Form fields={[
        { name: 'x', type: 'text', label: 'X', validation },
        { name: 'y', type: 'select', label: 'Y', validation, options: [{ value: 'a', text: 'A' }] },
    ]} validateOnSubmit/>);

    await user.type(screen.getByLabelText('X'), 'ab');
    await user.selectOptions(screen.getByLabelText('Y'), 'a');

    expect(validation).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();
});

test('after a failed validateOnSubmit submit every field revalidates on change', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form fields={[
        { name: 'x', type: 'text', label: 'X', validation: required },
        { name: 'z', type: 'checkbox', label: 'Z', validation: (value) => value === true || 'Must be checked' },
        { name: 'y', type: 'select', label: 'Y', validation: required, options: [{ value: 'a', text: 'A' }] },
    ]} validateOnSubmit onSubmit={onSubmit} submitText="Send"/>);
    const alertOf = (label: string) => within(screen.getByLabelText(label).parentElement!).queryByRole('alert');

    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(3));

    await user.type(screen.getByLabelText('X'), 'a');
    await waitFor(() => expect(alertOf('X')).toBeNull());
    await user.clear(screen.getByLabelText('X'));
    await waitFor(() => expect(alertOf('X')?.textContent).toBe('Required field'));

    await user.click(screen.getByLabelText('Z'));
    await waitFor(() => expect(alertOf('Z')).toBeNull());

    await user.selectOptions(screen.getByLabelText('Y'), 'a');
    await waitFor(() => expect(alertOf('Y')).toBeNull());
    await user.selectOptions(screen.getByLabelText('Y'), '');
    await waitFor(() => expect(alertOf('Y')?.textContent).toBe('Required field'));
    expect(onSubmit).not.toHaveBeenCalled();
});
