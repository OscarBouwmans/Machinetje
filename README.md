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

```Svelte
<!-- SomeComponent.svelte -->

<script>
    import { resourceMachine } from './resource-machine.js';

    const resource = resourceMachine();

    let fileName = $state('');

    function download() {
        // dispatch actions to your machinetje to change its state:
        resource.dispatch('download', fileName);
        //                 👆 action   👆 action parameter
    }

    function cancel() {
        resource.dispatch('cancel');
    }
</script>

{#if resource.state === 'idle'}
    <input bind:value={fileName} />
    <button onclick={download}>Download file</button>
{:else if resource.state === 'loading'}
    <p>Downloading resource…</p>
    <button onclick={cancel}>Cancel</button>
{:else if resource.state === 'done'}
    <p>{resource.context.responseText}</p>
<!-- etc… -->
```

Alternatively, use the `<SelectState>` helper component with snippets:

```Svelte
<!-- SomeComponent.svelte -->

<script>
    import { SelectState } from 'machinetje';
    import { resourceMachine } from './resource-machine.js';

    const resource = resourceMachine();

    let fileName = $state('');
</script>

<SelectState machinetje={resource}>
    {#snippet idle({ dispatch })}
        <input bind:value={fileName} />
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
        effect: loadResource,
        on: {
            cancel: 'idle',
            success: 'done',
            failure: 'error'
        }
    },
    done: {
        effect({ value, setContext }) {
            setContext({ responseText: value });
        },
    },
    error: {
        effect({ value, setContext }) {
            setContext({ errorMessage: value });
        },
        on: {
            retry: 'loading'
        },
    }
}, 'idle', { responseText: null, errorMessage: null });

async function loadResource({ value, setContext, dispatch, signal }) {
    // set a clear context to remove any potential old errors
    setContext({});

    // `value` represents the optional extra parameter provided to `dispatch`
    if (!value) {
        return dispatch('failure', 'No file name provided');
    }
    const resourceUrl = `example.com/resource/${value}.zip`;

    try {
        // use the `signal` to allow cancelation of the request
        const response = await fetch(resourceUrl, { signal });
        const responseText = await response.text();
        if (!response.ok) {
            throw new Error(responseText);
        }
        // dispatch 'success' action, and place the responseText in the context
        dispatch('success', responseText);
    }
    catch (error) {
        dispatch('failure', error.message);
    }
}
```

When the effect is an `async` function, use the provided `signal` to handle cancelation cases (see [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)), as exampled above. This signal will be aborted whenever a dispatched action causes a state transition.

Alternatively, a sync effect can return a cleanup function:

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
    finished: {
        effect({ value, setContext }) {
            setContext({ result: value });
        }
    },
}, 'ready', { result: null });

function doTheHardWork({ dispatch }) {
    const worker = new Worker('heavy-script.js');

    worker.onmessage = (event) => {
        dispatch('result', event.data);
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

## Setting Context

Context can be set in an effect, under the following conditions:
- the context is set _synchronously_
- the context is set _before_ any `dispatch`

If these conditions are not met, the `setContext` call is ignored and a warning is logged to the console.

```JavaScript
// some-machine.js

export const someMachine = machinetje({
    idle: {
        async effect({ setContext }) {
            // this works:
            setContext({ value: 'Hello' });

            // this would not update the context:
            setTimeout(() => setContext({ value: 'World' }), 1);

            // this also would not update the context:
            await somePromise();
            setContext({ value: 'World' });
        },
        on: {
            work: 'busy',
        }
    },
    busy: {
        effect({ setContext, dispatch }) {
            // this works:
            setContext({ value: 'Hello' });
            dispatch('done');

            // calls after dispatch are ignored:
            setContext({ value: 'World' }); // <= ignored
        },
        on: {
            done: 'idle',
        }
    }
}, 'idle', { value: null });
```

## State Machine Recovery

Machinetjes can be recovered from a serialized state. Serializing a machinetje's full state is done by reading the `state` and `context` properties from the instance. The serialized state can be stored somewhere (e.g. in LocalStorage), and later used to recover the machinetje:

```JavaScript
import { someMachine } from './some-machine.js';

const instance = someMachine();

// storing the state
const { state, context } = instance;
const serialized = JSON.stringify({ state, context });
localStorage.setItem('stored-state', serialized);

// recovering the state
const serialized = localStorage.getItem('stored-state');
const { state, context } = JSON.parse(serialized);
const recovered = someMachine(state, context);
```

Note that the recovered machinetje is a new instance. If the current recovered state has an effect, it will run, even if it had already run to completion in the original instance. This is so that if the machinetje is recovered in a resource loading state, for example, it will again start the effect to load the resource.

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
        effect: loadResource,
        on: {
            cancel: 'idle',
            success: 'done',
            failure: 'error'
        }
    },
    done: {
        effect({ value, setContext }) {
            setContext({ responseText: value });
        }
    },
    error: {
        effect({ value, setContext, context, dispatch }) {
            setContext({ errorMessage: value });
            autoRetry({ context, setContext, dispatch, value });
        },
        on: {
            retry: 'loading'
        }
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
        setContext({ responseText });
        dispatch('success', responseText);
    }
    catch (error) {
        setContext({ errorMessage: error.message });
        dispatch('failure', error.message);
    }
}

function autoRetry({ context, setContext, dispatch }) {
    if (context.remainingAutoRetries <= 0) {
        return;
    }
    const remainingAutoRetries = context.remainingAutoRetries - 1;
    setContext({ remainingAutoRetries });
    dispatch('retry');
}
```

```Svelte
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
            stop: 'stopped'
        }
    }
}, 'stopped', { startTime: null });
```

```Svelte
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
    {#snippet running({ dispatch })}
        <button onclick={() => dispatch('stop')}>Stop</button>
    {/snippet}
</SelectState>
```
