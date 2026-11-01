import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
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
