import { describe, expect, test, vi } from 'vitest';
import { machinetje } from '$lib/index.js';

const testMachinetje = machinetje({
    a: {
        on: {
            toB: 'b',
            toC: 'c',
        },
    },
    b: {
        on: {
            toA: 'a',
        },
        effect({ setContext, dispatch }) {
            setContext('X');
            dispatch('toA');
            setContext('Y');
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
}, 'a');

describe('void effects', () => {
    test('context can be set within effects, before subsequent dispatches', () => {
        const instance = testMachinetje();
        
        instance.dispatch('toB');
        expect(instance.context).toBe('X');
    });
});
