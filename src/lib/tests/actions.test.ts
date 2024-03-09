import { describe, expect, test, vi } from 'vitest';
import { machinetje } from '$lib/index.js';

const testMachinetje = machinetje({
    a: {
        on: {
            toB: 'b',
        },
    },
    b: {
        effect({ value }) {
            value?.();
        },
        on: {
            toA: 'a',
        },
    }
}, 'a', {} as { value?: string, testCallback?: () => void });

describe('void effects', () => {
    test('action parameters are passed on to the effects', () => {
        const instance = testMachinetje();
        const value = vi.fn();
        instance.dispatch('toB', value);
        expect(value).toHaveBeenCalled();
    });
});
