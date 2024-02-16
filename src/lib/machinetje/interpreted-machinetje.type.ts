
export type InterpretedMachinetje<Context, State extends string, Action extends string> = {
    readonly state: State,
    readonly context: Context | undefined,
    readonly isFinal: boolean,
    dispatch(action: Action, ...params: any[]): void,
};
