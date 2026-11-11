import { test } from 'vitest';
import type { Preprocessor } from '../src/index.js';

test('a preprocessor may return a string, a number, or { value, selection }', () => {
  const asString: Preprocessor = (value) => value.toString();
  const asNumber: Preprocessor = () => 1;
  const withSelection: Preprocessor = (value) => ({
    value: value.toString(),
    selection: { from: 1, end: 1 },
  });
  const withoutSelection: Preprocessor = (value) => ({ value });

  // @ts-expect-error a selection needs a value
  const noValue: Preprocessor = () => ({ selection: { from: 1, end: 1 } });

  void [asString, asNumber, withSelection, withoutSelection, noValue];
});
