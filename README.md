# Machinetje
Tiny state machines for Svelte 5+

## Motivation
_Machinetje_ in Dutch means _little machine_, which perfectly describes this package. It's a small state machine solution, intended to be a good match with Svelte 5+.

## Machine Definition

Start by describing the possible states and their transitions, ending with the initial state.

```JavaScript
    const resourceMachine = machinetje({
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

```HTML
    <script>
        import { resourceMachine } from '…';

        const resource = resourceMachine();

        function download() {
            resource.dispatch('download');
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
    <script>
        import { SelectState } from 'machinetje';
        import { resourceMachine } from '…';

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

Use `context` to store data into your machinetje, such as a counter value, fetch responses, error messages, etc. You can write to the context only at the start of effects, as shown later.

## Effects

These can write to the context of your machinetje, and interact with the world around it.

```JavaScript
    const resourceMachine = machinetje({
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

When the effect is an `async` function, use the provided `signal` to handle cancelation cases (see [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)). This signal will be aborted whenever a new action causes a state transition.

Alternatively, a sync function can be provided that returns a cleanup function:

```JavaScript
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

        worker.onmessage = (e) => {
            dispatch('result', e.message);
        };

        return cleanup() {
            worker.terminate();
        };
    }

    // running the machine:
    const heavyProcessing = heavyProcessingMachine();
    heavyProcessing.dispatch('start');
    heavyProcessing.dispatch('cancel'); // <= causes the cleanup function to run
```
