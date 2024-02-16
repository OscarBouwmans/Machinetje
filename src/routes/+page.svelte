<script lang="ts">
    import { stopwatchMachine } from './example-machines/stopwatch.machine';
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

