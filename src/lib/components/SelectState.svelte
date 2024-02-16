<script lang="ts">
    import type { InterpretedMachinetje } from '../machinetje/interpreted-machinetje.type.js';

    let { machinetje, children, ...snippets } = $props<{
        machinetje: InterpretedMachinetje,
        children?: () => any,
        snippets: (() => any)[],
    }>();

    let state = $derived(machinetje.state);
    let snippet = $derived(snippets?.[state]);
</script>

{#if snippet}
    {@render snippet(machinetje)}
{:else if children}
    {@render children()}
{/if}
