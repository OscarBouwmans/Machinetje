import { unstate } from "svelte";
import type { MachinetjeConfig } from "./machinetje-config.type.js";
import type { MachinetjeContext, ContextOrUpdateContext } from "./machinetje-context.type.js";
import { initialAction } from "./default-actions.js";
import type { EffectjeCleanup, EffectjeEnvironment } from "./effectje.type.js";
import { statesWithoutActions } from "./internal/states-without-actions.js";

export function machinetje<
    State extends string,
    Action extends string,
    Context extends MachinetjeContext,
>(
    config: MachinetjeConfig<State, Action, Context>,
    initialState: State,
    initialContext?: Context,
) {
    const finalStates = statesWithoutActions(config);

    return function interpret(recoveredState?: State, recoveredContext?: Context) {
        let state = $state(recoveredState ?? initialState);
        let context = $state(Object.freeze(unstate(recoveredContext ?? initialContext ?? ({} as Context))));

        let runningEffectCleanup: EffectjeCleanup | undefined;
        let abortController: AbortController | undefined;

        enterCurrentState(initialAction as any);

        function dispatch(action: Action, context?: Context): void
        function dispatch(action: Action, updateContext?: (context: Context) => Context): void
        function dispatch(action: Action, setContext?: ContextOrUpdateContext<Context>) {
            const targetState = config[state].on?.[action];
            if (!targetState) {
                return;
            }
            if (!config[targetState]) {
                throw new Error(`State "${targetState}" does not exist in the state machine`);
            }
            exitCurrentState();
            state = targetState;
            updateContext(setContext);
            enterCurrentState(action);
        };

        function enterCurrentState(action: Action) {
            const { effect } = config[state];
            if (!effect) {
                return;
            }

            abortController = new AbortController();
            const signal = abortController.signal;

            let contextMayBeUpdated = true;
            const environment = {
                action,
                get context() {
                    return context;
                },
                setContext: (newContext: Context) => {
                    if (signal.aborted) {
                        console.warn('Cannot set context after the effect has expired.');
                        return;
                    }
                    if (!contextMayBeUpdated) {
                        console.warn('Context can only be set synchronously during effect initialisation.');
                        return;
                    }
                    context = Object.freeze(unstate(newContext));
                },
                dispatch(action: Action, setContext?: Parameters<typeof dispatch>[1]) {
                    if (signal.aborted) {
                        console.warn('Cannot dispatch an action after the effect has expired.');
                        return;
                    }
                    dispatch(action, setContext);
                },
                signal,
            } satisfies EffectjeEnvironment<Action, Context>;

            const cleanup = effect(environment) ?? undefined;
            contextMayBeUpdated = false;

            if (!(cleanup instanceof Promise)) {
                runningEffectCleanup = cleanup;
            }
        }

        function updateContext(cOrSetC?: ContextOrUpdateContext<Context>) {
            if (!cOrSetC) {
                return;
            }
            if (typeof cOrSetC === 'function') {
                context = cOrSetC(unstate(cOrSetC(context)));
                return;
            }
            context = Object.freeze(unstate(cOrSetC));
        }

        function exitCurrentState() {
            abortController?.abort();
            runningEffectCleanup?.();
            runningEffectCleanup = undefined;
        }
    
        return Object.freeze({
            get state() {
                return state;
            },
            get context() {
                return context;
            },
            get isFinal() {
                return finalStates.includes(state);
            },
            dispatch,
        });
    }
};
