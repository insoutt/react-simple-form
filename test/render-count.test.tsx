import { createElement, Profiler } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Form } from '../src';

const fieldRenders = vi.hoisted(() => ({ count: 0 }));

// Count FormField renders, every root render re-renders all of them
vi.mock('../src/components/FormField', async (importOriginal) => {
    const original = (await importOriginal<typeof import('../src/components/FormField')>()).default;
    return { default: (props: any) => { fieldRenders.count++; return createElement(original, props); } };
});

const fields = Array.from({ length: 5 }, (_, i) => ({ name: 'f' + i, type: 'text' as const, label: 'F' + i }));

test('typing into a dirty field under validateOnSubmit re-renders neither the root nor the fields', async () => {
    const user = userEvent.setup();
    render(<Form fields={fields} validateOnSubmit clearText="Clear"/>);

    await user.type(screen.getByLabelText('F0'), 'a');
    expect(screen.getByRole('button', { name: 'Clear' })).not.toBeNull();

    fieldRenders.count = 0;
    await user.type(screen.getByLabelText('F0'), 'bcdefghij');

    expect(fieldRenders.count).toBe(0);
    expect(screen.getByRole('button', { name: 'Clear' })).not.toBeNull();
});

test('with hideClearButton typing commits no render at all', async () => {
    const user = userEvent.setup();
    let commits = 0;
    render(<Profiler id="form" onRender={() => { commits++; }}>
        <Form fields={fields} validateOnSubmit hideClearButton/>
    </Profiler>);

    await user.type(screen.getByLabelText('F0'), 'a');
    commits = 0;
    await user.type(screen.getByLabelText('F0'), 'bcdefghij');

    expect(commits).toBe(0);
});
