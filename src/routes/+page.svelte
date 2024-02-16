<script lang="ts">
    import { machinetje } from '$lib/machinetje/machinetje.svelte';
    import LiveTime from './LiveTime.svelte';

    let time = $state(0);

    const stopwatch = machinetje({
        stopped: {
            on: {
                start: 'running',
                reset: 'stopped',
            },
            effect({ action, context, setContext }) {
                switch (action) {
                    case 'stop': {
                        const pauseTime = new Date().getTime() - context!.startDate!.getTime();
                        return setContext({
                            pauseTime,
                            startDate: null,
                        });
                    }
                    case 'reset': {
                        return setContext({
                            pauseTime: null,
                            startDate: null,
                        });
                    }
                    default: {
                        return;
                    }
                }
            }
        },
        running: {
            on: {
                stop: 'stopped',
                reset: 'stopped',
            },
            effect({ setContext }) {
                const pausedTime = stopwatch.context.pauseTime || 0;
                setContext({
                    startDate: new Date(new Date().getTime() - pausedTime),
                    pauseTime: null,
                });
            }
        }
    }, 'stopped', {
        startDate: null as Date | null,
        pauseTime: null as number | null,
    });
</script>

<h1>Stopwatch</h1>

<output>{ stopwatch.state }</output>
<output><LiveTime {...stopwatch.context} /></output>
<br>
<br>
<button on:click={() => stopwatch.dispatch('start') }>Start</button>
<button on:click={() => stopwatch.dispatch('stop') }>Stop</button>
<button on:click={() => stopwatch.dispatch('reset') }>Reset</button>

