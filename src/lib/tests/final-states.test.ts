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
    test('state a is not final', () => {
        const instance = testMachinetje();
        expect(instance.isFinal).toBe(false);
    });
    test('state b is final', () => {
        const instance = testMachinetje();
        instance.dispatch('toB');
        expect(instance.isFinal).toBe(true);
    });
    test('state c is not final', () => {
        const instance = testMachinetje();
        instance.dispatch('toC');
        expect(instance.isFinal).toBe(false);
    });
    test('state x is final', () => {
        const instance = testMachinetje();
        instance.dispatch('toC');
        instance.dispatch('toX');
        expect(instance.isFinal).toBe(true);
    });
});
