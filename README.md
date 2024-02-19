# Machinetje
Tiny state machines for Svelte 5+

## Motivation
_Machinetje_ in Dutch means _little machine_, which perfectly describes this package. It's a small state machine solution, intended to be a good match with Svelte 5+.

## Machine Definition

Start by describing the possible states and their transitions, ending with the initial state. This may be done in a seperate `.js`/`.ts` file, to keep the logic seperate from your Components.

```JavaScript
// resource-machine.js

import { machinetje } from 'machinetje';

export const resourceMachine = machinetje(
    {
//      👇 state
        idle: {
            on: {
//              👇 action    👇 target state
                download: 'loading'
            }
        },
        loading: {
            on: {
                cancel: 'idle',
                success: 'done',
                failure: 'error'
            }
        },
        done: {},
        error: {
            on: {
                retry: 'loading'
            }
        }
    },
//  👇 initial state
    'idle',
//  👇 initial context
    {
        responseText: null,
        errorMessage: null
    }
);
```

Use `context` to store data (a.k.a. extended state) into your machinetje, such as fetch responses, error messages, remaining retry attemps, etc. You can write to the context when dispatching an action, or at the start of an effect, as shown later.

## Reading state, dispatching actions

In your component files, you can start a new instance of the machinetje:

```HTML
<!-- SomeComponent.svelte -->

<script>
    import { resourceMachine } from './resource-machine.js';

    const resource = resourceMachine();

    function download() {
        // dispatch actions to your machinetje to change its state:
        resource.dispatch('download');
        //                 👆 action
    }

    function cancel() {
        resource.dispatch('cancel');
    }
</script>

{#if resource.state === 'idle'}
    <button onclick={download}>Download the resource</button>
{:else if resource.state === 'loading'}
    <p>Downloading resource…</p>
    <button onclick={cancel}>Cancel</button>
{:else if resource.state === 'done'}
    <p>{resource.context.responseText}</p>
<!-- etc… -->
```

Alternatively, use the `<SelectState>` helper component with snippets:

```HTML
<!-- SomeComponent.svelte -->

<script>
    import { SelectState } from 'machinetje';
    import { resourceMachine } from './resource-machine.js';

    const resource = resourceMachine();
</script>

<SelectState machinetje={resource}>
    {#snippet idle({ dispatch })}
        <button onclick={() => dispatch('download')}>Download</button>
    {/snippet}
    {#snippet loading({ dispatch })}
        <p>Downloading resource…</p>
        <button onclick={() => dispatch('cancel')}>Cancel</button>
    {/snippet}
    {#snippet done({ context })}
        <p>{context.responseText}</p>
    <!-- etc… -->
</SelectState>
```

## Effects

Effects let you write to the context of your machinetje, and interact with the world around it. Within effects, use the provided `dispatch` property to pass on data to the next state via actions.

```JavaScript
// resource-machine.js

export const resourceMachine = machinetje({
    idle: {
        on: {
            download: 'loading'
        }
    },
    loading: {
        on: {
            cancel: 'idle',
            success: 'done',
            failure: 'error'
        },
        effect: loadResource
    },
    done: {},
    error: {
        on: {
            retry: 'loading'
        }
    }
}, 'idle', { responseText: null, errorMessage: null });

async function loadResource({ setContext, dispatch, signal }) {
    // set a clear context to remove any potential old errors
    setContext({});

    try {
        // use the `signal` to allow cancelation of the request
        const response = await fetch('example.com/resource', { signal });
        const responseText = await response.text();
        if (!response.ok) {
            throw new Error(responseText);
        }
        // dispatch 'success' action, and place the responseText in the context
        dispatch('success', { responseText });
    }
    catch (error) {
        dispatch('failure', { errorMessage: error.message });
    }
}
```

When the effect is an `async` function, use the provided `signal` to handle cancelation cases (see [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)), as exampled above. This signal will be aborted whenever a dispatched action causes a state transition.

Alternatively, a sync function can be provided that returns a cleanup function:

```JavaScript
// heavy-processing-machine.js

const heavyProcessingMachine = machinetje({
    ready: {
        on: {
            start: 'processing',
        }
    },
    processing: {
        on: {
            result: 'finished',
            cancel: 'ready',
        },
        effect: doTheHardWork
    },
    finished: {},
}, 'ready', { result: null });

function doTheHardWork({ dispatch }) {
    const worker = new Worker('heavy-script.js');

    worker.onmessage = (event) => {
        dispatch('result', { result: event.data });
    };

    return cleanup() {
        worker.terminate();
    };
}

// AnotherComponent.svelte
import { heavyProcessingMachine } from './heavy-processing-machine.js';

const heavyProcessing = heavyProcessingMachine();
heavyProcessing.dispatch('start');
heavyProcessing.dispatch('cancel'); // <= causes the cleanup function to run
```

## Examples

### Fetching a resource

```JavaScript
// resource-machine.js

export const resourceMachine = machinetje({
    idle: {
        on: {
            download: 'loading'
        }
    },
    loading: {
        on: {
            cancel: 'idle',
            success: 'done',
            failure: 'error'
        },
        effect: loadResource
    },
    done: {},
    error: {
        on: {
            retry: 'loading'
        },
        effect: autoRetry,
    }
}, 'idle', { responseText: null, errorMessage: null, remainingAutoRetries: 2 });

async function loadResource({ setContext, dispatch, signal }) {
    setContext({});

    try {
        const response = await fetch('example.com/resource', { signal });
        const responseText = await response.text();
        if (!response.ok) {
            throw new Error(responseText);
        }
        dispatch('success', { responseText });
    }
    catch (error) {
        dispatch('failure', { errorMessage: error.message });
    }
}

function autoRetry({ context, dispatch }) {
    if (context.remainingAutoRetries > 0) {
        const remainingAutoRetries = context.remainingAutoRetries - 1;
        dispatch('retry', { remainingAutoRetries });
    }
}
```

```HTML
<!-- Resource.svelte -->

<script>
    import { resourceMachine } from './resource-machine.js';

    const resource = resourceMachine();
</script>

<SelectState machinetje={resource}>
    {#snippet idle({ dispatch })}
        <button onclick={() => dispatch('download')}>Download</button>
    {/snippet}
    {#snippet loading({ dispatch })}
        <p>Downloading resource…</p>
        <button onclick={() => dispatch('cancel')}>Cancel</button>
    {/snippet}
    {#snippet done({ context })}
        <p>{context.responseText}</p>
    {/snippet}
    {#snippet error({ dispatch, context })}
        <p>{context.errorMessage}</p>
        <button onclick={() => dispatch('retry')}>Retry</button>
    {/snippet}
</SelectState>
```

### A simple stopwatch

```JavaScript
// stopwatch-machine.js

export const stopwatchMachine = machinetje({
    stopped: {
        effect: ({ setContext }) => {
            setContext({ startTime: null });
        },
        on: {
            start: 'running'
        }
    },
    running: {
        effect: ({ setContext }) => {
            setContext({ startTime: new Date() });
        },
        on: {
            stop: 'stopped',
            tick: 'running'
        }
    }
}, 'stopped', { startTime: null });
```

```HTML
<!-- Stopwatch.svelte -->

<script>
    import { stopwatchMachine } from './stopwatch-machine.js';

    const stopwatch = stopwatchMachine();

    let currentTime = $state(0);

    $effect(() => {
        if (stopwatch.state !== 'running') {
            currentTime = 0;
            return;
        }

        let nextFrame;
        function renderLoop() {
            const now = Date.now();
            const elapsed = now.getTime() - stopwatch.context.startTime.getTime();
            currentTime = elapsed / 1000;
            nextFrame = requestAnimationFrame(renderLoop);
        };
        renderLoop();
        return () => cancelAnimationFrame(nextFrame);
    });
</script>

<p>{currentTime}</p>

<SelectState machinetje={stopwatch}>
    {#snippet stopped({ dispatch })}
        <button onclick={() => dispatch('start')}>Start</button>
    {/snippet}
    {#snippet running({ dispatch, context })}
        <button onclick={() => dispatch('stop')}>Stop</button>
    {/snippet}
</SelectState>
```
