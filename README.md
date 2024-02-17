# Machinetje
Tiny state machines for Svelte 5+

## Motivation
_Machinetje_ in Dutch means _little machine_, which perfectly describes this package. It's a small state machine solution, intended to be a good match with Svelte 5+.

## Machine Definition

Start by describing the possible states and their transitions, ending with the initial state. This may be done in a seperate `.js`/`.ts` file, to keep the logic seperate from your Components.

```JavaScript
// resource-machine.js

import { machinetje } from 'machinetje';

export const resourceMachine = machinetje({
    idle: {
//  👆 state
        on: {
            download: 'loading'
//          👆 action    👆 target state
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
}, 'idle');
```

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

Use `context` to store data (a.k.a. extended state) into your machinetje, such as fetch responses, error messages, etc. You can write to the context only at the start of effects, as shown later.

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
    done: {
        // inline effect to save action data in the machinetje's context
        effect: ({ setContext }, responseText) => setContext({ responseText })
    },
    error: {
        on: {
            retry: 'loading'
        },
        effect: ({ setContext }, errorMessage) => setContext({ errorMessage })
    }
}, 'idle');

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
        // pass the responseText on with the 'success' action
        dispatch('success', responseText);
    }
    catch (error) {
        dispatch('failure', error.message);
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
    finished: {
        effect: ({ setContext }, result) => setContext({ result })
    },
}, 'ready');

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
