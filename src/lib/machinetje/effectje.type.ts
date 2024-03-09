
export type EffectjeEnvironment<Action extends string, Context, ActionValue = any> = {
    action: Action | Symbol;
    value?: ActionValue;
    context: Readonly<Context>;
    setContext: (context: Context) => void;
    dispatch: (action: Action, ...params: any[]) => void;
    signal: AbortSignal;
};

export type Effectje<Action extends string, Context> = (
    environment: EffectjeEnvironment<Action, Context>
) => void | Promise<void> | EffectjeCleanup;

export type EffectjeCleanup = () => void;
