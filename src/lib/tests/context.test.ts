import { describe, expect, test, vi } from 'vitest';
import { machinetje } from '$lib/index.js';

const testMachinetje = machinetje({
    a: {
        on: {
            toB: 'b',
            toC: 'c',
            toD: 'd',
        },
    },
    b: {
        on: {
            toA: 'a',
        },
        effect({ setContext, dispatch }) {
            setContext({ value: 'X' });
            dispatch('toA');
            setContext({ value: 'Y' });
        }
    },
    c: {
        on: {
            toA: 'a',
        },
        async effect({ dispatch, signal }) {
            signal.onabort = () => dispatch('toB');
            dispatch('toA');
        }
    },
    d: {
        on: {
            toA: 'a',
        },
        async effect({ value, setContext }) {
            setContext({ value: 'K' });
            await Promise.resolve();
            setContext({ value: 'L' });
            value.testCallback?.();
        }
    }
}, 'a', {} as { value?: string });

describe('void effects', () => {
    test('context is by default an empty object', () => {
        const instance = testMachinetje();
        expect(instance.context).toEqual({});
    });

    test('context can be recovered', () => {
        const instance = testMachinetje(undefined, { value: 'Z' });
        expect(instance.context).toEqual({ value: 'Z' });
    });

    test('context can be set within effects, and only before subsequent dispatches', () => {
        const instance = testMachinetje();
        
        instance.dispatch('toB');
        expect(instance.context).toEqual({ value: 'X' });
    });

    test('context cannot be set async', async () => {
        const instance = testMachinetje();

        const testCallback = vi.fn();
        instance.dispatch('toD', { testCallback });
        await Promise.resolve();
        expect(testCallback).toHaveBeenCalled();
        expect(instance.context).toEqual({ value: 'K' });
    });
});
