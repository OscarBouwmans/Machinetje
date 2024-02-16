<script lang="ts">
    import { machinetje } from '$lib/machinetje/machinetje.svelte';

    let time = 0;

    const stopwatch = machinetje({
        stopped: {
            on: {
                start: 'running'
            }
        },
        running: {
            on: {
                stop: 'stopped'
            },
            effect() {
                const interval = setInterval(() => {
                    time += 1;
                }, 1000);
                return () => clearInterval(interval);
            }
        }
    }, 'stopped');
</script>

<h1>Stopwatch</h1>

<output>{ stopwatch.state }</output>
<output>{ time }</output>
<br>
<br>
<button on:click={() => stopwatch.dispatch('start') }>Start</button>
<button on:click={() => stopwatch.dispatch('stop') }>Stop</button>

