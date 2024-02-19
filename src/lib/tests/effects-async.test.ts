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
        async effect({ signal, context }) {
            context.entry?.();
            signal.onabort = () => context.abort?.();
            return new Promise((never) => never);
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
}, 'a', {} as { entry?: () => void, abort?: () => void });

describe('void effects', () => {
    test('signals are passed and aborted correctly', () => {
        const instance = testMachinetje();
        const entry = vi.fn();
        const abort = vi.fn();

        instance.dispatch('toB', { entry, abort });
        expect(entry).toHaveBeenCalledOnce();
        expect(abort).not.toHaveBeenCalled();

        instance.dispatch('toA');
        expect(entry).toHaveBeenCalledOnce();
        expect(abort).toHaveBeenCalledOnce();
        
        instance.dispatch('toB', { entry, abort });
        instance.dispatch('toA');
        expect(entry).toHaveBeenCalledTimes(2);
        expect(abort).toHaveBeenCalledTimes(2);
    });

    test('effects cannot dispatch actions after abortion', () => {
        const instance = testMachinetje();
        instance.dispatch('toC');
        expect(instance.state).toBe('a');
    });
});
