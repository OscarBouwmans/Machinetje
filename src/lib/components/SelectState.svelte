<script lang="ts" generics="T extends InterpretedMachinetje<any, any, any>">
    import type { InterpretedMachinetje } from '../machinetje/interpreted-machinetje.type.js';

    type SnippetMap = { 
        [state in T['state']]?: (machinetje: T) => any
    };

    let { machinetje, children, ...snippets } = $props<{
        machinetje: T,
        children?: () => any,
    } & SnippetMap>();

    let state = $derived(machinetje.state);
    let snippet = $derived(selectSnippet(state));

    function selectSnippet(state: T['state']) {
        const snippetMap = snippets as SnippetMap;
        return snippetMap[state] ?? null;
    }
</script>

{#if snippet}
    {@render snippet(machinetje)}
{:else if children}
    {@render children()}
{/if}
