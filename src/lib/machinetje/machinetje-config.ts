
export type MachinetjeConfig<
    State extends string,
    Action extends string,
    Context,
> = {
    [state in State]: {
        on?: {
            [action in Action]?: State;
        },
        effect?: Effectje<Action, Context>;
    }
};

export type EffectjeEnvironment<Action extends string, Context> = {
    action: Action;
    params: any[];
    context?: Readonly<Context>;
    setContext: (context: Context) => void;
    dispatch: (action: Action, ...params: any[]) => void;
    signal: AbortSignal;
};

export type Effectje<Action extends string, Context> = (environment: EffectjeEnvironment<Action, Context>) => void | Promise<void> | EffectjeCleanup;
export type EffectjeCleanup = () => void;
