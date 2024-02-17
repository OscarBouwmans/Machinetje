import { unstate } from "svelte";
import type { MachinetjeConfig } from "./machinetje-config.type.js";
import { initialAction } from "./default-actions.js";
import type { EffectjeCleanup, EffectjeEnvironment } from "./effectje.type.js";
import { statesWithoutActions } from "./internal/states-without-actions.js";

export function machinetje<
    Context,
    State extends string,
    Action extends string,
>(
    config: MachinetjeConfig<State, Action, Context>,
    initialState: State,
    initialContext?: Context,
) {
    const finalStates = statesWithoutActions(config);

    return function interpret() {
        let state = $state(initialState);
        let context = $state(Object.freeze(unstate(initialContext)));

        let runningEffectCleanup: EffectjeCleanup | undefined;
        let abortController: AbortController | undefined;

        enterCurrentState(initialAction as any, []);

        function dispatch(action: Action, ...params: any[]) {
            const targetState = config[state].on?.[action];
            if (!targetState) {
                return;
            }
            if (!config[targetState]) {
                throw new Error(`State "${targetState}" does not exist in the state machine`);
            }
            exitCurrentState();
            state = targetState;
            enterCurrentState(action, params);
        };

        function enterCurrentState(action: Action, params: any[]) {
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
                dispatch(action: Action, ...params: any[]) {
                    if (signal.aborted) {
                        console.warn('Cannot dispatch an action after the effect has expired.');
                        return;
                    }
                    dispatch(action, ...params);
                },
                signal,
            } satisfies EffectjeEnvironment<Action, Context>;

            const cleanup = effect(environment, ...params) ?? undefined;
            contextMayBeUpdated = false;

            if (!(cleanup instanceof Promise)) {
                runningEffectCleanup = cleanup;
            }
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
