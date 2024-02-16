<script lang="ts">
    import { SelectState } from '$lib/index.js';
    import { stopwatchMachine } from './example-machines/stopwatch.machine.js';
    import LiveTime from './LiveTime.svelte';

    const stopwatch = stopwatchMachine();
</script>

<h1>Stopwatch</h1>

<output>{ stopwatch.state }</output>
<output><LiveTime {...stopwatch.context} /></output>
<br>
<br>
<button on:click={() => stopwatch.dispatch('start') }>Start</button>
<button on:click={() => stopwatch.dispatch('stop') }>Stop</button>
<button on:click={() => stopwatch.dispatch('reset') }>Reset</button>

<hr>

<SelectState machinetje={stopwatch}>
    {#snippet stopped({ dispatch }: { dispatch: (event: 'start' | 'reset') => void })}
        <p>Stopped</p>
        <button onclick={() => dispatch('start')}>Start</button>
        <button onclick={() => dispatch('reset')}>Reset</button>
    {/snippet}
    {#snippet running({ dispatch }: { dispatch: (event: 'stop') => void })}
        <p>Running</p>
        <button onclick={() => dispatch('stop')}>Stop</button>
    {/snippet}
    <p>Fallback</p>
</SelectState>
