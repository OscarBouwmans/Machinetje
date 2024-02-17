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
            toB: 'b',
        },
        effect(_, entry: () => void, exit: () => void) {
            entry?.();
            return exit;
        }
    },
    c: {
        on: {
            toA: 'a',
        },
        effect({ dispatch }) {
            dispatch('toA');
            dispatch('toB');
        }
    },
}, 'a');

describe('void effects', () => {
    test('effects are started and cleaned up', () => {
        const instance = testMachinetje();
        const entry = vi.fn();
        const exit = vi.fn();

        instance.dispatch('toB', entry, exit);
        expect(entry).toHaveBeenCalledOnce();
        expect(exit).not.toHaveBeenCalled();

        instance.dispatch('toA');
        expect(entry).toHaveBeenCalledOnce();
        expect(exit).toHaveBeenCalledOnce();
        
        instance.dispatch('toB', entry, exit);
        instance.dispatch('toA');
        expect(entry).toHaveBeenCalledTimes(2);
        expect(exit).toHaveBeenCalledTimes(2);
    });

    test('effects do not run after invalid action', () => {
        const instance = testMachinetje();
        const spy = vi.fn();
        instance.dispatch('toB', spy);
        expect(spy).toHaveBeenCalled();
        instance.dispatch('toC');
        expect(spy).toHaveBeenCalledTimes(1);
    });

    test('effects are restarted when re-entering the same state', () => {
        const instance = testMachinetje();
        const entry = vi.fn();
        const exit = vi.fn();
        instance.dispatch('toB', entry, exit);
        instance.dispatch('toB', entry, exit);
        instance.dispatch('toA');
        expect(entry).toHaveBeenCalledTimes(2);
        expect(exit).toHaveBeenCalledTimes(2);
    });

    test('effects can dispatch actions succesfully only once', () => {
        const instance = testMachinetje();
        instance.dispatch('toC');
        expect(instance.state).toBe('a');
    });
});
