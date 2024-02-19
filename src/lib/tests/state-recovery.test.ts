import { describe, expect, test } from 'vitest';
import { machinetje } from '$lib/index.js';

const testMachinetje = machinetje({
    a: {
        on: {
            toB: 'b',
            toC: 'c',
        },
    },
    b: {},
    c: {
        on: {
            toX: 'x',
        },
    },
    x: {},
}, 'a');

describe('final states', () => {
    test('initial state is used when no recovery state is provided', () => {
        const instance = testMachinetje();
        expect(instance.state).toBe('a');
    });

    test('recovery state is used when provided', () => {
        const instance = testMachinetje('x');
        expect(instance.state).toBe('x');
    });
});
