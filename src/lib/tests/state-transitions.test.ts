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
    c: {},
}, 'a');

describe('state transitions', () => {
    test('should transition from a to b', () => {
        const instance = testMachinetje();
        instance.dispatch('toB');
        expect(instance.state).toBe('b');
    });
    test('should transition from a to c', () => {
        const instance = testMachinetje();
        instance.dispatch('toC');
        expect(instance.state).toBe('c');
    });
    test('should not transition from b to c', () => {
        const instance = testMachinetje();
        instance.dispatch('toB');
        instance.dispatch('toC');
        expect(instance.state).toBe('b');
    });
    test('should ignore invalid action names', () => {
        const instance = testMachinetje();
        instance.dispatch('orNotToB' as any);
        expect(instance.state).toBe('a');
    });
});
